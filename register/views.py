from django.shortcuts import render, redirect

def register(request):
    if request.method == 'POST':
        
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        print(username, password)
        
        return redirect('app')
    
    return render(request, 'register/register.html')

