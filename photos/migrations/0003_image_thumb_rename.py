# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        db.rename_column('photos_photo', 'image_thumb', 'image_thumb1x')

    def backwards(self, orm):
        db.rename_column('photos_photo', 'image_thumb1x', 'image_thumb')

    models = {
        'photos.photo': {
            'Meta': {'object_name': 'Photo'},
            'exif_aperture': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'exif_focal_length': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'exif_iso': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'exif_shutter_speed': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'image_file1x': ('django.db.models.fields.files.ImageField', [], {'max_length': '100'}),
            'image_file2x': ('django.db.models.fields.files.ImageField', [], {'max_length': '100'}),
            'image_thumb1x': ('django.db.models.fields.files.ImageField', [], {'max_length': '100'}),
            'post': ('django.db.models.fields.related.OneToOneField', [], {'to': "orm['photos.Post']", 'unique': 'True'}),
            'tags': ('tagging.fields.TagField', [], {})
        },
        'photos.post': {
            'Meta': {'object_name': 'Post'},
            'comment': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'pub_date': ('django.db.models.fields.DateField', [], {'default': 'datetime.date.today'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '50', 'blank': 'True'})
        }
    }

    complete_apps = ['photos']