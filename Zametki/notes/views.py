import json
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.http import require_POST, require_GET
from django.views.decorators.csrf import csrf_exempt
from .models import Note
from .forms import NoteForm

def app(request, pk=None):
    notes = Note.objects.all()
    note = get_object_or_404(Note, pk=pk) if pk else None

    # classic server-rendered save (keeps compatibility)
    if request.method == 'POST' and 'title' in request.POST:
        form = NoteForm(request.POST, instance=note)
        if form.is_valid():
            n = form.save()
            return redirect('app', pk=n.pk)

    form = NoteForm(instance=note)
    return render(request, 'notes/app.html', {
        'notes': notes,
        'form': form,
        'active': note
    })

# ---- JSON / AJAX API ----
@require_POST
def api_new(request):
    n = Note.objects.create(title='', text='')
    return JsonResponse({'ok': True, 'id': n.id, 'title': n.title, 'pinned': n.pinned})

@require_GET
def api_get(request, pk):
    n = get_object_or_404(Note, pk=pk)
    return JsonResponse({
        'id': n.id, 'title': n.title, 'text': n.text, 'pinned': n.pinned
    })

@require_POST
def api_save(request, pk):
    try:
        data = json.loads(request.body)
    except Exception:
        return HttpResponseBadRequest('invalid json')

    n = get_object_or_404(Note, pk=pk)
    title = data.get('title', '')
    text = data.get('text', '')
    n.title = title
    n.text = text
    n.save()
    return JsonResponse({'ok': True, 'id': n.id, 'updated': n.updated.isoformat()})

@require_POST
def api_delete(request, pk):
    n = get_object_or_404(Note, pk=pk)
    n.delete()
    return JsonResponse({'ok': True, 'id': pk})

@require_POST
def api_pin(request, pk):
    n = get_object_or_404(Note, pk=pk)
    n.pinned = not n.pinned
    n.save()
    return JsonResponse({'ok': True, 'id': n.id, 'pinned': n.pinned})
