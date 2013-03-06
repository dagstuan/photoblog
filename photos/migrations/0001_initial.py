# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Post'
        db.create_table('photos_post', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('title', self.gf('django.db.models.fields.CharField')(max_length=50, blank=True)),
            ('pub_date', self.gf('django.db.models.fields.DateField')(default=datetime.date.today)),
            ('comment', self.gf('django.db.models.fields.TextField')(blank=True)),
        ))
        db.send_create_signal('photos', ['Post'])

        # Adding model 'Photo'
        db.create_table('photos_photo', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('image_file', self.gf('django.db.models.fields.files.ImageField')(max_length=100)),
            ('image_file1x', self.gf('django.db.models.fields.files.ImageField')(max_length=100)),
            ('image_thumb', self.gf('django.db.models.fields.files.ImageField')(max_length=100)),
            ('post', self.gf('django.db.models.fields.related.OneToOneField')(to=orm['photos.Post'], unique=True)),
            ('exif_focal_length', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('exif_aperture', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('exif_iso', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('exif_shutter_speed', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('tags', self.gf('tagging.fields.TagField')()),
        ))
        db.send_create_signal('photos', ['Photo'])


    def backwards(self, orm):
        # Deleting model 'Post'
        db.delete_table('photos_post')

        # Deleting model 'Photo'
        db.delete_table('photos_photo')


    models = {
        'photos.photo': {
            'Meta': {'object_name': 'Photo'},
            'exif_aperture': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'exif_focal_length': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'exif_iso': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'exif_shutter_speed': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'image_file': ('django.db.models.fields.files.ImageField', [], {'max_length': '100'}),
            'image_file1x': ('django.db.models.fields.files.ImageField', [], {'max_length': '100'}),
            'image_thumb': ('django.db.models.fields.files.ImageField', [], {'max_length': '100'}),
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