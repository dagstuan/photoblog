# coding=UTF-8

from django.db import models
import datetime
from PIL import Image
from xml.dom.minidom import parseString
import settings
from django.core.files import File
import StringIO
from django.core.files.uploadedfile import InMemoryUploadedFile
import tagging
from tagging.fields import TagField
from tagging.models import Tag
import copy
import os

import pdb

class Post(models.Model):
    title = models.CharField("Title", max_length=50, blank=True)
    pub_date = models.DateField("Publish date", default=datetime.date.today)
    comment = models.TextField("Comment", blank=True)
    
    def published(self):
        return self.pub_date <= datetime.date.today()
    
    def delete(self, *args, **kwargs):
        self.photo.delete()
        
        super(Post, self).delete(*args, **kwargs)
    
    @models.permalink
    def get_absolute_url(self):
        return ('photos.views.post', [str(self.id)])
    
    def is_published(self):
        return self.pub_date <= datetime.date.today()
    is_published.boolean = True
    is_published.short_description = "Is published?"
    
    def admin_thumbnail(self):
        return '<img src="%s"/>' % self.photo.image_thumb.url
    admin_thumbnail.allow_tags = True
    admin_thumbnail.short_description = 'Thumbnail'
        
    def __unicode__(self):
        return self.title
        
    class Meta:
        verbose_name = 'Post'

class Photo(models.Model):
    image_file = models.ImageField("Image file 2x", upload_to=settings.IMAGE_FOLDER)
    image_file1x = models.ImageField("Image file 1x", upload_to=settings.IMAGE_FOLDER)
    image_thumb = models.ImageField(upload_to=settings.IMAGE_FOLDER, editable=False)
    post = models.OneToOneField(Post)
    exif_focal_length = models.CharField(max_length=50, editable=False)
    exif_aperture = models.CharField(max_length=50, editable=False)
    exif_iso = models.CharField(max_length=50, editable=False)
    exif_shutter_speed = models.CharField(max_length=50, editable=False)
    tags = TagField()
    
    def _cleanup_tags(self):
        for tag in Tag.objects.all():
            if tag.items.all().count() == 0:
                tag.delete()
    
    def reset_tags(self):
        self.etags = ''
        self.tags = ''
        
        self.save_tags(file_read=True)
    
    def save_tags(self, img=None, file_read=False):
        self.etags = self.tags
        
        # If reading the tags from file..
        if file_read == True:
            if img == None:
                img = Image.open(self.image_file.file)
        
            xml = parseString(img.applist[3][1].replace('\n', '').strip('http://ns.adobe.com/xap/1.0/\x00'))

            bag = xml.getElementsByTagName('rdf:Bag')

            if bag:
                tags = [elem.childNodes[0].data for elem in bag[0].getElementsByTagName('rdf:li')]
            
                for tag in tags:
                    Tag.objects.add_tag(self, tag.replace(' ', ''))
        
        self.tags = ''
        for tag in self.etags:
            self.tags += tag.name + ', '
        
        super(Photo, self).save()
        
        # Some tags may have been rendered unused. Cleaning them up.
        self._cleanup_tags()
    
    def save_exif(self, img=None):
        if img == None:
            img = Image.open(self.image_file.file)
        
        exif = img._getexif()
        
        # Finding EXIF focal length
        self.exif_focal_length = str(exif[37386][0]) + 'mm'
    
        # Finding EXIF aperture f-number
        fnumber = float(exif[33437][0]) / exif[33437][1]
    
        self.exif_aperture = 'ƒ/' + ('%.1f' % fnumber)
    
        # Finding EXIF aperture ISO-value
        self.exif_iso = 'ISO ' + str(exif[34855])
    
        # Finding EXIF aperture shutter duration
        shutter_divisor = exif[33434][0]
        shutter_dividend = exif[33434][1]
    
        if shutter_dividend > 1:
            self.exif_shutter_speed = str(shutter_divisor) + '/' + str(shutter_dividend) + ' sec' 
        else:
            self.exif_shutter_speed = str(shutter_divisor) + ' sec'
    
    #
    # Helper function for generating the thumbs
    #
    def generate_thumbs(self, img=None):
        try:
            orig_thumb = Photo.objects.get(pk=self.pk).image_thumb
            orig_thumb.delete(save=False)
        except:
            pass
        
        if img == None:
            img = Image.open(self.image_file.file)
        
        path = settings.MEDIA_ROOT + settings.IMAGE_FOLDER
        
        name = self.image_file.name
        filename_thumb = name.split('.')[0] + '_thumb.jpg'
        
        cropsize = min(img.size)
        
        # Creating square thumb from middle of picture
        w,h = img.size
        
        x1 = (w/2) - (cropsize/2)
        x2 = x1 + cropsize
        y1 = (h/2) - (cropsize/2)
        y2 = y1 + cropsize
        
        crop = img.crop((x1,y1,x2,y2))
        thumb_size = (122, 122)
        crop.thumbnail(thumb_size, Image.ANTIALIAS)

        # Saving thumb while keeping it in memory
        thumb_io = StringIO.StringIO()
        crop.save(thumb_io, format='JPEG')
        
        thumb_file = InMemoryUploadedFile(thumb_io, None, filename_thumb, 'image/jpeg', thumb_io.len, None)
        
        self.image_thumb.save(filename_thumb, thumb_file, save=False)
    
    #
    # Looks to check if the photo field needs replacement, and deletes original file.
    # Expects a string fileattr argument
    #
    def _delete_existing_file(self, fileattr):
        try:
            if isinstance(getattr(self, fileattr).file, InMemoryUploadedFile):
                orig_file = getattr(Photo.objects.get(pk=self.pk), fileattr)
                orig_file.delete(save=False)
                
                # Returning true because the file existed and is now deleted,
                # Meaning that tags should be read from the new file.
                return True
        except:
            # Returning true because no file existed before, meaning tags will have
            # to be read from the uploaded file.
            return True
            
        return False
    
    def save(self, *args, **kwargs):
        # Opens the biggest image available for creation of thumbs
        img = Image.open(self.image_file.file)
        
        is_new_image = self._delete_existing_file('image_file')
        self._delete_existing_file('image_file1x')
        
        self.save_exif(img)
        
        self.generate_thumbs(img)
        
        # Need to save before setting tags so that incoming tags will have a PK to bind to.
        super(Photo, self).save(*args, **kwargs)
        
        # Reading from file if the uploaded image is new, otherwise just reading from the TagField.
        self.save_tags(img, file_read=True if is_new_image==True else False)
    
    def _delete_tags(self):
        tags = Tag.objects.get_for_object(self)
        
        for tag in tags:
            if tag.items.all().count() == 1:
                tag.delete()
    
    def delete(self, *args, **kwargs):
        self._delete_tags()
        
        try:
            self.image_file.delete()
        except:
            pass
            
        try:
            self.image_file1x.delete()
        except:
            pass
        
        try:
            self.image_thumb.delete()
        except:
            pass
        
        super(Photo, self).delete(*args, **kwargs)
    
    def __unicode__(self):
        return self.post.title
    
    class Meta:
        verbose_name = 'Photo'

tagging.register(Photo, tag_descriptor_attr='etags')