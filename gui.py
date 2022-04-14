from log_control import log
import tkinter as tk

def clearOut():
    lbl_sku.grid_forget()
    input_sku.grid_forget()

def onHome():
    log('Cargando ventana principal...')
    root.geometry('250x150')
    clearOut()
    lbl_sku.grid(row=0, column=0, pady=15)
    input_sku.grid(row=0, column=1, pady=15)
    
def onPaymentSettings():
    log('Cargando configuracion de datos de pago...')
    root.geometry('450x350')
    clearOut()

def onAdvancedSettings():
    log('Cargando configuracion avanzada...')
    root.geometry('500x500')
    clearOut()

log('Configurando GUI...')
root = tk.Tk()
root.title('Interfaz grafica')
root.resizable(False, False)
root.iconbitmap('icon.ico')

log('Configurando ventanas...')
sku = tk.StringVar()
home_frame = tk.Frame(root)
home_frame.pack()
lbl_sku = tk.Label(home_frame, text='SKU: ')
input_sku = tk.Entry(home_frame, width=7, textvariable=sku)

log('Configurando barra de menu...')
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

onHome()

root.mainloop()
