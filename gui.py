from log_control import log
import tkinter as tk
from configparser import ConfigParser

parser = ConfigParser()
parser.read('config.ini')

def clearOut():
    home_frame.pack_forget()
    payment_settings_frame.pack_forget()
    advanced_settings_frame.pack_forget()

def onHome():
    log('Cargando ventana principal...')
    clearOut()
    home_frame.pack()
    lbl_sku.place(x=80, y=10)
    input_sku.place(x=115, y=10)
    btn_start.place(x=93, y=40)
    
def refreshPaymentSettings():
    input_card_number.delete(0, 'end')
    input_card_owner_name.delete(0, 'end')
    input_card_expiration_month.delete(0, 'end')
    input_card_expiration_year.delete(0, 'end')
    input_cvv.delete(0, 'end')
    input_card_owner_run.delete(0, 'end')
    input_card_number.insert(0, parser.get('payment_process', 'card_number'))
    input_card_owner_name.insert(0, parser.get('payment_process', 'card_owner_name'))
    input_card_expiration_month.insert(0, parser.get('payment_process', 'card_expiration_month'))
    input_card_expiration_year.insert(0, parser.get('payment_process', 'card_expiration_year'))
    input_cvv.insert(0, parser.get('payment_process', 'cvv'))
    input_card_owner_run.insert(0, parser.get('payment_process', 'card_owner_run'))


def onPaymentSettings():
    log('Cargando configuracion de datos de pago...')
    clearOut()
    refreshPaymentSettings()
    payment_settings_frame.pack()
    lbl_card_number.place(x=10, y=10)
    lbl_card_owner_name.place(x=10, y=35)
    lbl_card_expiration_month.place(x=10, y=60)
    lbl_card_expiration_year.place(x=10, y=85)
    lbl_cvv.place(x=10, y=110)
    lbl_card_owner_run.place(x=10, y=135)
    input_card_number.place(x=190, y=10)
    input_card_owner_name.place(x=190, y=35)
    input_card_expiration_month.place(x=190, y=60)
    input_card_expiration_year.place(x=190, y=85)
    input_cvv.place(x=190, y=110)
    input_card_owner_run.place(x=190, y=135)
    btn_save_payment_settings.place(x=190, y=160)


def onAdvancedSettings():
    log('Cargando configuracion avanzada...')
    clearOut()
    advanced_settings_frame.pack()

def start():
    print('Se ha iniciado la aplicacion.')

def savePaymentSettings():
    parser.set('payment_process', 'card_number', card_number.get())
    parser.set('payment_process', 'card_owner_name', card_owner_name.get())
    parser.set('payment_process', 'card_expiration_month', card_expiration_month.get())
    parser.set('payment_process', 'card_expiration_year', card_expiration_year.get())
    parser.set('payment_process', 'cvv', cvv.get())
    parser.set('payment_process', 'card_owner_run', card_owner_run.get())
    # Si el archivo tiene modo escritura, entonces se sobreescribe con la nueva informacion
    with open('config.ini', 'w') as configfile:
        parser.write(configfile)
    print('alert: Se ha guardado la configuracion de pago.')

def saveAdvancedSettings():
    print('alert: Se ha guardado la configuracion avanzada.')

log('Configurando GUI...')
root = tk.Tk()
root.title('SNKRMON')
root.resizable(False, False)
root.iconbitmap('icon.ico')

log('Configurando frames...')
# Home Frame
sku = tk.StringVar()
home_frame = tk.Frame(root, width=250, height=75)
lbl_sku = tk.Label(home_frame, text='SKU: ')
input_sku = tk.Entry(home_frame, width=7, textvariable=sku)
btn_start = tk.Button(home_frame, text='Comenzar', command=start)
# Payment Settings Frame
card_number = tk.StringVar()
card_owner_name = tk.StringVar()
card_expiration_month = tk.StringVar()
card_expiration_year = tk.StringVar()
cvv = tk.StringVar()
card_owner_run = tk.StringVar()
payment_settings_frame = tk.Frame(root, width=400, height=200)
lbl_card_number = tk.Label(payment_settings_frame, text='Numero de tarjeta: ')
input_card_number = tk.Entry(payment_settings_frame, width=18, textvariable=card_number)
lbl_card_owner_name = tk.Label(payment_settings_frame, text='Nombre del propietario: ')
input_card_owner_name = tk.Entry(payment_settings_frame, width=32, textvariable=card_owner_name)
lbl_card_expiration_month = tk.Label(payment_settings_frame, text='Mes de expiracion: ')
input_card_expiration_month = tk.Entry(payment_settings_frame, width=4, textvariable=card_expiration_month)
lbl_card_expiration_year = tk.Label(payment_settings_frame, text='Año de expiracion: ')
input_card_expiration_year = tk.Entry(payment_settings_frame, width=4, textvariable=card_expiration_year)
lbl_cvv = tk.Label(payment_settings_frame, text='Codigo de seguridad: ')
input_cvv = tk.Entry(payment_settings_frame, width=5, textvariable=cvv)
lbl_card_owner_run = tk.Label(payment_settings_frame, text='RUN del propietario de la tarjeta: ')
input_card_owner_run = tk.Entry(payment_settings_frame, width=12, textvariable=card_owner_run)
btn_save_payment_settings = tk.Button(payment_settings_frame, text='Guardar', command=savePaymentSettings)
# Advanced Settings Frame
advanced_settings_frame = tk.Frame(root, width=400, height=400)
btn_save_advanced_settings = tk.Button(advanced_settings_frame, text='Guardar', command=saveAdvancedSettings)

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
