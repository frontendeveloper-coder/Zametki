from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth import login
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages

# РЕГИСТРАЦИЯ
def register(request):
    if request.method == 'POST':
        u = request.POST.get('username')
        p = request.POST.get('password')
        if User.objects.filter(username=u).exists():
            messages.error(request, "Такой пользователь уже есть")
        else:
            user = User.objects.create_user(username=u, password=p)
            login(request, user)
            return redirect('app')
    return render(request, 'register/register.html')

# ВХОД
def user_login(request):
    if request.method == 'POST':
        u = request.POST.get('username')
        p = request.POST.get('password')
        user = authenticate(username=u, password=p) # Проверяем данные
        if user is not None:
            login(request, user)
            return redirect('app')
        else:
            messages.error(request, "Неверный логин или пароль")
    return render(request, 'register/login.html')

# ВЫХОД
def user_logout(request):
    logout(request)
    return redirect('login')