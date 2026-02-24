from django import forms
from .models import Note

class NoteForm(forms.ModelForm):
    class Meta:
        model = Note
        fields = ['title', 'text']
        widgets = {
            'title': forms.TextInput(attrs={
                'id': 'note-title',
                'placeholder': 'Заголовок'
            }),
            'text': forms.Textarea(attrs={
                'id': 'note-text',
                'placeholder': 'Начни писать заметку...'
            }),
        }
