from django.db import models

class Note(models.Model):
    title = models.CharField(max_length=200, blank=True)
    text = models.TextField(blank=True)
    pinned = models.BooleanField(default=False)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-pinned', '-updated']

    def __str__(self):
        return self.title or "Без названия"
