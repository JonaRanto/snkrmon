from log_control import log
from configparser import ConfigParser
from wd import wd_conn
from gui import gui
import time, os
import tkinter as tk
from tkinter.messagebox import showinfo
from alarm_control import purchase_alert

from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as ec
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

parser = ConfigParser()
parser.read('config.ini')

chrome_path = parser.get('paths', 'chrome_path')
chrome_filename = parser.get('files', 'chrome_filename')
port = parser.get('other', 'chrome_port')
chrome_files = parser.get('dirs', 'chrome_files_dir')
current_path = os.getcwd() + '\\'
window_size = parser.get('other', 'window_width') + ',' + parser.get('other', 'window_height')

if not os.path.isdir(parser.get('dirs', 'log_dir')):
    os.makedirs(parser.get('dirs', 'log_dir'))
if not os.path.isdir(parser.get('dirs', 'chrome_files_dir')):
    os.makedirs(parser.get('dirs', 'chrome_files_dir'))
    log('Configurando Chrome...')
    os.system('robocopy ' + current_path + '\\easy-auto-refresh ' + current_path + chrome_files + ' /MIR')
    set_extension = wd_conn(chrome_path, chrome_filename, port, chrome_files, current_path, window_size)
    time.sleep(1)
    set_extension.close()
    os.system('copy ' + current_path + '\\easy-auto-refresh\\Default\\Preferences ' + current_path + chrome_files + '\\Default')

sku = gui()

wd = wd_conn(chrome_path, chrome_filename, port, chrome_files, current_path, window_size)

root = tk.Tk()
root.attributes('-topmost', True)
root.withdraw()

log('Obteniendo sku...')
url = parser.get('urls', 'nike_url').replace('[sku]', sku)

# Verificar si el usuario se encuentra logeado.
wd.execute_script('window.open("");')
wd.get(url.replace('[redirect]', 'false'))
wd.switch_to.window(wd.window_handles[1])
while True:
    wd.get(r'https://www.nike.cl/login')
    log('Esperando inicio de sesion...', 20)
    showinfo('Iniciar sesion', 'Se debe ejecutar el auto-refresh e iniciar sesion para continuar.')
    wd.get(r'https://www.nike.cl/_secure/account#/profile')
    log('Verificando que se haya iniciado sesion.')
    if wd.current_url == r'https://www.nike.cl/_secure/account#/profile':
        log('Se ha iniciado sesion correctamente.', 20)
        break
    else:
        log('No se ha iniciado sesion correctamente.', 40)

log('Estableciendo tiempo de espera limite...')
elements_timeout_limit = parser.get('other', 'elements_timeout_limit')

# Proceso de compra
while True:
    try:
        log('Buscando disponibilidad de compra...', 20)
        while True:
            wd.get(url.replace('[redirect]', 'true'))
            WebDriverWait(wd, elements_timeout_limit).until(ec.presence_of_element_located((By.XPATH, '//div[@class="cart-template full-cart span12 active"]//tr[@data-bind="css: {\'muted\': !hasTotal()}"]//td[@class="monetary"]')))
            available = wd.find_element(By.XPATH, '//div[@class="cart-template full-cart span12 active"]//tr[@data-bind="css: {\'muted\': !hasTotal()}"]//td[@class="monetary"]').text
            if available.find('$') != -1:
                log('Se ha encontrado una oportunidad de compra.', 20)
                break
        log('Continuando con el proceso de compra...', 20)
        wd.get(r'https://www.nike.cl/checkout/#/orderfrom')

        log('Estableciendo variables...')
        card_number = parser.get('payment_process', 'card_number')
        card_owner_name = parser.get('payment_process', 'card_owner_name')
        card_expiration_month = int(parser.get('payment_process', 'card_expiration_month'))
        card_expiration_year = int(parser.get('payment_process', 'card_expiration_year'))
        cvv = parser.get('payment_process', 'cvv')
        card_owner_run = parser.get('payment_process', 'card_owner_run')

        log('Cambiando focus a zona de pago.')
        wd.switch_to.frame(wd.find_element(By.XPATH, '//iframe[@class="span12"]'))
        WebDriverWait(wd, elements_timeout_limit).until(ec.presence_of_element_located((By.XPATH, '//div[@class="CardForm"]')))
        log('Llenando numero de cuotas.')
        time.sleep(1)
        wd.find_element(By.ID, 'creditCardpayment-card-0Brand').send_keys('Total')
        log('Llenando mes de vencimiento de tarjeta.')
        for i in range(card_expiration_month):
            wd.find_element(By.ID, 'creditCardpayment-card-0Month').send_keys(Keys.DOWN)
        log('Llenando anio de vencimiento de tarjeta.')
        card_expiration_year_first_value = int(wd.find_element(By.XPATH, '//select[@id="creditCardpayment-card-0Year"]//option[2]').text)
        card_expiration_year_difference = card_expiration_year - card_expiration_year_first_value
        for i in range(card_expiration_year_difference + 1):
            wd.find_element(By.ID, 'creditCardpayment-card-0Year').send_keys(Keys.DOWN)
        log('Llenando numero de tarjeta.')
        time.sleep(0.1)
        wd.find_element(By.ID, 'creditCardpayment-card-0Number').click()
        wd.find_element(By.ID, 'creditCardpayment-card-0Number').send_keys(card_number)
        log('Llenando nombre y apellido del propietario de la tarjeta.')
        time.sleep(0.1)
        wd.find_element(By.ID, 'creditCardpayment-card-0Name').click()
        wd.find_element(By.ID, 'creditCardpayment-card-0Name').send_keys(card_owner_name)
        log('Llenando CVV.')
        time.sleep(0.1)
        wd.find_element(By.ID, 'creditCardpayment-card-0Code').click()
        wd.find_element(By.ID, 'creditCardpayment-card-0Code').send_keys(cvv)
        log('Llenando rut del propietario de la tarjeta.')
        time.sleep(0.1)
        wd.find_element(By.ID, 'holder-document-0').click()
        wd.find_element(By.ID, 'holder-document-0').send_keys(card_owner_run)

        log('Cambiando el focus a la pagina principal.')
        wd.switch_to.default_content()

        time.sleep(1)
        if wd.current_url == 'https://www.nike.cl/checkout/#/payment':
            log('Cambiando focus a zona de pago.')
            wd.switch_to.frame(wd.find_element(By.XPATH, '//iframe[@class="span12"]'))
            if len(wd.find_element(By.ID, 'creditCardpayment-card-0Brand').find_elements(By.TAG_NAME, 'option')) != 1:
                wd.find_element(By.ID, 'creditCardpayment-card-0Brand').send_keys('Total')
                log('El proceso de compra se ha finalizado exitosamente.')
                purchase_alert(wd)
                break
        log('Cambiando el focus a la pagina principal.')
        wd.switch_to.default_content()
    except Exception as e:
        log(str(e), 40)
