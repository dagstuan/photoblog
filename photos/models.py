# coding=UTF-8

from django.db import models
import datetime
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from xml.dom.minidom import parseString
import settings
from django.core.files import File
import StringIO
from django.core.files.uploadedfile import InMemoryUploadedFile
import tagging
from tagging.fields import TagField
from tagging.models import Tag, TaggedItem
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
        return '<img src="%s"/>' % self.photo.image_thumb1x.url
    admin_thumbnail.allow_tags = True
    admin_thumbnail.short_description = 'Thumbnail'
        
    def __unicode__(self):
        return self.title
        
    class Meta:
        verbose_name = 'Post'

class Photo(models.Model):
    #
    # Every photo needs to have two sizes to optimize for both retina and
    # normal displays. Currently uploading two sizes manually since lightrooms export
    # resize is much better than PILs.
    #
    image_file2x = models.ImageField("Image file 2x", upload_to=settings.IMAGE_FOLDER)
    image_file1x = models.ImageField("Image file 1x", upload_to=settings.IMAGE_FOLDER)
    image_thumb2x = models.ImageField(upload_to=settings.IMAGE_FOLDER, editable=False)
    image_thumb1x = models.ImageField(upload_to=settings.IMAGE_FOLDER, editable=False)
    post = models.OneToOneField(Post)
    exif_focal_length = models.CharField(max_length=50, editable=False)
    exif_aperture = models.CharField(max_length=50, editable=False)
    exif_iso = models.CharField(max_length=50, editable=False)
    exif_shutter_speed = models.CharField(max_length=50, editable=False)
    exif_longitude = models.FloatField(max_length=50, editable=False)
    exif_latitude = models.FloatField(max_length=50, editable=False)
    tags = TagField()
    
    #
    # tag_limit is a variable used to determine the minimum amount of
    # times a tag is used before deletion (see delete())
    # Object is supplied because of delete.
    #
    def _cleanup_tags(self, photo=None, tag_limit=0):
        tags = Tag.objects.all()
        
        if photo != None:
            tags = Tag.objects.get_for_object(photo)
        
        for tag in tags:
            if tag.items.all().count() <= tag_limit:
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
                img = Image.open(self.image_file2x.file)
        
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
    
    def _set_exif_gps_data(self, gpsinfo):
        def _get_if_exist(data, key):
            if key in data:
                return data[key]

            return None
    
        def _convert_to_degress(value):
            """Helper function to convert the GPS coordinates stored in the EXIF to degress in float format"""
            d0 = value[0][0]
            d1 = value[0][1]
            d = float(d0) / float(d1)

            m0 = value[1][0]
            m1 = value[1][1]
            m = float(m0) / float(m1)

            s0 = value[2][0]
            s1 = value[2][1]
            s = float(s0) / float(s1)

            return d + (m / 60.0) + (s / 3600.0)
        
        gps_data = {}
        
        for t in gpsinfo:
            sub_decoded = GPSTAGS.get(t, t)
            gps_data[sub_decoded] = gpsinfo[t]
            
        lat = -1
        lon = -1
        gps_latitude = _get_if_exist(gps_data, 'GPSLatitude')
        gps_latitude_ref = _get_if_exist(gps_data, 'GPSLatitudeRef')
        gps_longitude = _get_if_exist(gps_data, 'GPSLongitude')
        gps_longitude_ref = _get_if_exist(gps_data, 'GPSLongitudeRef')

        if gps_latitude and gps_latitude_ref and gps_longitude and gps_longitude_ref:
            lat = _convert_to_degress(gps_latitude)
            if gps_latitude_ref != "N":
                lat = 0 - lat
            
            lon = _convert_to_degress(gps_longitude)
            if gps_longitude_ref != "E":
                lon = 0 - lon
        
        self.exif_latitude = lat
        self.exif_longitude = lon
            
    def save_exif(self, img=None, save=True):
        if img == None:
            img = Image.open(self.image_file2x.file)
        
        exif = img._getexif()
        tags = {v:k for k, v in TAGS.items()}
        
        focal_length_tag = tags['FocalLength']
        f_number_tag = tags['FNumber']
        iso_speed_tag = tags['ISOSpeedRatings']
        exposure_tag = tags['ExposureTime']
        gps_info_tag = tags['GPSInfo']
        
        # Finding EXIF focal length
        self.exif_focal_length = str(exif[focal_length_tag][0]) + 'mm'
    
        # Finding EXIF aperture f-number
        fnumber = float(exif[f_number_tag][0]) / exif[f_number_tag][1]
    
        self.exif_aperture = 'ƒ/' + ('%.1f' % fnumber)
    
        # Finding EXIF aperture ISO-value
        self.exif_iso = 'ISO ' + str(exif[iso_speed_tag])
    
        # Finding EXIF aperture shutter duration
        shutter_divisor = exif[exposure_tag][0]
        shutter_dividend = exif[exposure_tag][1]
    
        if shutter_dividend > 1:
            self.exif_shutter_speed = str(shutter_divisor) + '/' + str(shutter_dividend) + ' sec' 
        else:
            self.exif_shutter_speed = str(shutter_divisor) + ' sec'
        
        if gps_info_tag in exif:
            self._set_exif_gps_data(exif[gps_info_tag])
        else:
            print 'Could not save gps exif for image with post-title', self.post.id
                        
        if save:
            super(Photo, self).save()
    
    #
    # If the thumbs exist, get rid of them!
    #
    def _delete_thumbs(self, save=True):
        try:
            orig_thumb2x = Photo.objects.get(pk=self.pk).image_thumb2x
            orig_thumb2x.delete(save=False)
        except:
            pass
            
        try:
            orig_thumb1x = Photo.objects.get(pk=self.pk).image_thumb1x
            orig_thumb1x.delete(save=False)
        except:
            pass
        
        if save:
            super(Photo, self).save()
    
    #
    # Saving image img, with filename fname, to variable var.
    #
    def _save_thumb(self, img, fname, var):
        # Saving thumb while keeping it in memory
        thumb_io = StringIO.StringIO()
        img.save(thumb_io, format='JPEG')
        
        thumb_file = InMemoryUploadedFile(thumb_io, None, fname, 'image/jpeg', thumb_io.len, None)
        
        var.save(fname, thumb_file, save=False)
    
    #
    # Helper function for generating the thumbs (retina and normal)
    # Save-argument is whether or not to save the model after generating.
    #
    def generate_thumbs(self, img=None, save=True):
        self._delete_thumbs(save)
        
        if img == None:
            img = Image.open(self.image_file2x.file)
        
        path = settings.MEDIA_ROOT + settings.IMAGE_FOLDER
        
        name = self.image_file1x.name
        filename_thumb1x = name.split('.')[0] + '_thumb.jpg'
        filename_thumb2x = name.split('.')[0] + '_thumb_2x.jpg'
        
        cropsize = min(img.size)
        
        # Creating square thumb from middle of picture
        w,h = img.size
        
        x1 = (w/2) - (cropsize/2)
        x2 = x1 + cropsize
        y1 = (h/2) - (cropsize/2)
        y2 = y1 + cropsize
        
        crop2x = img.crop((x1,y1,x2,y2))
        crop1x = img.crop((x1,y1,x2,y2))
        
        thumb_size2x = (244, 244)
        thumb_size1x = (122, 122)
        
        crop2x.thumbnail(thumb_size2x, Image.ANTIALIAS)
        crop1x.thumbnail(thumb_size1x, Image.ANTIALIAS)
        
        self._save_thumb(crop2x, filename_thumb2x, self.image_thumb2x)
        self._save_thumb(crop1x, filename_thumb1x, self.image_thumb1x)
        
        if save:
            super(Photo, self).save()
    
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
        img = Image.open(self.image_file2x.file)
        
        #
        # If this is an edit, delete original images if trying to upload replacements.
        # Otherwise, nothing will happen in the next two lines.
        #
        is_new_image = self._delete_existing_file('image_file2x')
        self._delete_existing_file('image_file1x')
        
        #
        # Not saving any of these directly since they will be saved below.
        #
        self.save_exif(img, save=False)
        
        self.generate_thumbs(img, save=False)
        
        # Need to save before setting tags so that incoming tags will have a PK to bind to.
        super(Photo, self).save(*args, **kwargs)
        
        # Reading from file if the uploaded image is new, otherwise just reading from the TagField.
        self.save_tags(img, file_read=True if is_new_image==True else False)
    
    def delete(self, *args, **kwargs):
        #
        # Since the photo has not been deleted yet, the limit for tag
        # deletion should be at 1. Note that TaggedItems are deleted
        # further down. Since some tags may still be in use they wont
        # be deleted by _cleanup_tags()
        #
        self._cleanup_tags(photo=self, tag_limit=1)
        
        try:
            self.image_file2x.delete()
        except:
            pass
            
        try:
            self.image_file1x.delete()
        except:
            pass
        
        try:
            self.image_thumb2x.delete()
        except:
            pass
        
        try:
            self.image_thumb1x.delete()
        except:
            pass
        
        #
        # Deleting TaggedItem-objects for this photo.
        #
        for tagged_item in TaggedItem.objects.filter(object_id=self.pk):
            tagged_item.delete()
        
        super(Photo, self).delete(*args, **kwargs)
    
    def __unicode__(self):
        return self.post.title
    
    class Meta:
        verbose_name = 'Photo'

tagging.register(Photo, tag_descriptor_attr='etags')