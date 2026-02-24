from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('', include('notes.urls')),
    path('register/', include('register.urls')),
    path('admin/', admin.site.urls),
]
