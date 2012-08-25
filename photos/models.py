from django.db import models
import datetime
from PIL import Image
from xml.dom.minidom import parseString
import settings
from django.core.files import File
import StringIO
from django.core.files.uploadedfile import InMemoryUploadedFile
from tagging.fields import TagField
from tagging.models import Tag
import copy
import os

import pdb

class Post(models.Model):
    title = models.CharField(max_length=50, blank=True)
    pub_date = models.DateField(default=datetime.date.today)
    comment = models.TextField(blank=True)
    
    def published(self):
        return self.pub_date <= datetime.date.today()
    
    def delete(self, *args, **kwargs):
        self.photo.delete()
        
        super(Post, self).delete(*args, **kwargs)
    
    @models.permalink
    def get_absolute_url(self):
        return ('photos.views.photo', [str(self.id)])

class Photo(models.Model):
    # TODO: remove title attribute, use self.post.title instead
    image_file = models.ImageField(upload_to=settings.IMAGE_FOLDER)
    image_file1x = models.ImageField(upload_to=settings.IMAGE_FOLDER, editable=False)
    image_thumb = models.ImageField(upload_to=settings.IMAGE_FOLDER, editable=False)
    post = models.OneToOneField(Post)
    exif_focal_length = models.CharField(max_length=50, editable=False)
    exif_aperture = models.CharField(max_length=50, editable=False)
    exif_iso = models.CharField(max_length=50, editable=False)
    exif_shutter_speed = models.CharField(max_length=50, editable=False)
    tags = TagField()
    
    def set_tags(self, tags):
        Tag.objects.update_tags(self, tags)
    
    def get_tags(self):
        return Tag.objects.get_for_object(self)
    
    def save(self, *args, **kwargs):        
        try:
            img = Image.open(self.image_file.path)
        except:
            super(Photo, self).save(*args, **kwargs)
            img = Image.open(self.image_file.path)

        exif = img._getexif()
        
        # Finding EXIF focal length
        self.exif_focal_length = str(exif[37386][0]) + 'mm'
    
        # Finding EXIF aperture f-number
        fnumber = float(exif[33437][0]) / exif[33437][1]
    
        self.exif_aperture = 'f/' + ('%.1f' % fnumber)
    
        # Finding EXIF aperture ISO-value
        self.exif_iso = 'ISO ' + str(exif[34855])
    
        # Finding EXIF aperture shutter duration
        shutter_divisor = exif[33434][0]
        shutter_dividend = exif[33434][1]
    
        if shutter_dividend > 1:
            self.exif_shutter_speed = str(shutter_divisor) + '/' + str(shutter_dividend) + ' sec' 
        else:
            self.exif_shutter_speed = str(shutter_divisor) + ' sec'        
        
        path = settings.MEDIA_ROOT + settings.IMAGE_FOLDER
        
        filename = (img.filename.split('/')[-1]).split('.')
        filename2x = filename[0] + '_2x.jpg'
        filename1x = filename[0] + '.jpg'
        filename_thumb = filename[0] + '_thumb.jpg'

        max_size = (1800,1400)
        
        if img.size > max_size:
            img.thumbnail(max_size, Image.ANTIALIAS)
        
        self.image_file.name = 'images/' + filename2x
        
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
        
        # Creating the 1x image
        non_retina_size = (900, 700)
        
        non_retina_image = copy.copy(img)
        non_retina_image.thumbnail(non_retina_size, Image.ANTIALIAS)
        
        non_retina_io = StringIO.StringIO()
        non_retina_image.save(non_retina_io, format='JPEG')
        
        non_retina_file = InMemoryUploadedFile(non_retina_io, None, filename1x, 'image/jpeg', non_retina_io.len, None)
        
        os.rename(path + filename1x, path + filename2x)
        self.image_file1x.save(filename1x, non_retina_file, save=False)
                
        super(Photo, self).save(*args, **kwargs)
        
         # Automatically adding tags
        xml = parseString(img.applist[3][1].replace('\n', '').strip('http://ns.adobe.com/xap/1.0/\x00'))

        bag = xml.getElementsByTagName('rdf:Bag')

        if bag:
            tags = [elem.childNodes[0].data for elem in bag[0].getElementsByTagName('rdf:li')]
            
            for tag in tags:
                Tag.objects.add_tag(self, tag.replace(' ', ''))
    
    def delete(self, *args, **kwargs):
        tags = Tag.objects.get_for_object(self)
        
        for tag in tags:
            if tag.items.all().count() == 1:
                tag.delete()
        
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