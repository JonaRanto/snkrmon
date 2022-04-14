from log_control import log
import tkinter as tk

def onHome():
    root.geometry('350x250')

def onPaymentSettings():
    root.geometry('450x350')

def onAdvancedSettings():
    root.geometry('500x500')

log('Configurando GUI...')
root = tk.Tk()
root.title('Interfaz grafica')
root.resizable(False, False)
root.iconbitmap('icon.ico')
root.geometry('350x250')

menu_bar = tk.Menu(root)

file_menu = tk.Menu(menu_bar, tearoff=False)
file_menu.add_command(label='Ventana principal', command=onHome)
file_menu.add_command(label='Salir', command=root.quit)

config_menu = tk.Menu(menu_bar, tearoff=False)
config_menu.add_command(label='Datos de pago', command=onPaymentSettings)
config_menu.add_command(label='Avanzado', command=onAdvancedSettings)

menu_bar.add_cascade(label='Archivo', menu=file_menu)
menu_bar.add_cascade(label='Configurar', menu=config_menu)

root.config(menu=menu_bar)

root.mainloop()
