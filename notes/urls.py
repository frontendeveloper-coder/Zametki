from django.urls import path
from . import views
from register import views as register_views

urlpatterns = [
    path('register/', register_views.register, name='register'),
    path('', views.app, name='app'),
    path('<int:pk>/', views.app, name='app'),  # page load for direct link
    # API
    path('api/new/', views.api_new, name='api_new'),
    path('api/note/<int:pk>/', views.api_get, name='api_get'),
    path('api/save/<int:pk>/', views.api_save, name='api_save'),
    path('api/delete/<int:pk>/', views.api_delete, name='api_delete'),
    path('api/pin/<int:pk>/', views.api_pin, name='api_pin'),
]
