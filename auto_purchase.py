import os
import sys
import time
import tkinter as tk
from configparser import ConfigParser
from tkinter.messagebox import showinfo

from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as ec
from selenium.webdriver.support.ui import WebDriverWait

from alarm_control import purchase_alert
from log_control import log
from wd import wd_conn

parser = ConfigParser()
parser.read('config.ini')

def purchase(sku: str, port: str, chrome_files: str):
    
    chrome_path = parser.get('paths', 'chrome_path')
    chrome_filename = parser.get('files', 'chrome_filename')
    current_path = os.getcwd() + '\\'
    window_size = parser.get('other', 'window_width') + ',' + parser.get('other', 'window_height')
    identity = port + ' in ' + chrome_files

    wd = wd_conn(chrome_path, chrome_filename, port, chrome_files, current_path, window_size)

    root = tk.Tk()
    root.attributes('-topmost', True)
    root.withdraw()

    log('Obteniendo url...', identity=identity)
    url = parser.get('urls', 'nike_url').replace('[sku]', sku)

    # Verificar que exista la extension easy-auto-refresh
    while True:
        auto_refresh_extension = 'chrome://extensions/?id=aabcgdmkeabbnleenpncegpcngjpnjkc'
        auto_refresh_download = 'https://chrome.google.com/webstore/detail/easy-auto-refresh/aabcgdmkeabbnleenpncegpcngjpnjkc'
        wd.get(auto_refresh_extension)
        if wd.current_url != auto_refresh_extension:
            wd.get(auto_refresh_download)
            showinfo('Agregar extensión', 'Se debe agregar la extensión auto-refresh para continuar. (Luego de instalarla, se debe cerrar la pestaña de bienvenida de la extensión)')
        else:
            break
    # El script para abrir una nueva pestaña se ejecuta antes del redirect ya que nike lo bloquea
    wd.execute_script('window.open("");')
    wd.get(url.replace('[redirect]', 'false'))
    wd.switch_to.window(wd.window_handles[1])
    # Verificar si el usuario se encuentra logeado.
    while True:
        wd.get(r'https://www.nike.cl/login')
        log('Esperando inicio de sesión...', 20, identity=identity)
        showinfo('Iniciar sesion', 'Se debe ejecutar el auto-refresh con 1 segundo de refresco e iniciar sesion para continuar.')
        wd.get(r'https://www.nike.cl/_secure/account#/profile')
        log('Verificando que se haya iniciado sesion.')
        if wd.current_url == r'https://www.nike.cl/_secure/account#/profile':
            log('Se ha iniciado sesion correctamente.', 20, identity=identity)
            break
        else:
            log('No se ha iniciado sesion correctamente.', 40, identity=identity)

    log('Estableciendo tiempo de espera limite...', identity=identity)
    elements_timeout_limit = parser.get('other', 'elements_timeout_limit')

    # Proceso de compra
    while True:
        try:
            log('Buscando disponibilidad de compra...', 20, identity=identity)
            while True:
                wd.get(url.replace('[redirect]', 'true'))
                WebDriverWait(wd, elements_timeout_limit).until(ec.presence_of_element_located((By.XPATH, '//div[@class="cart-template full-cart span12 active"]//tr[@data-bind="css: {\'muted\': !hasTotal()}"]//td[@class="monetary"]')))
                available = wd.find_element(By.XPATH, '//div[@class="cart-template full-cart span12 active"]//tr[@data-bind="css: {\'muted\': !hasTotal()}"]//td[@class="monetary"]').text
                if available.find('$') != -1:
                    log('Se ha encontrado una oportunidad de compra.', 20, identity=identity)
                    break
            log('Continuando con el proceso de compra...', 20, identity=identity)
            wd.get(r'https://www.nike.cl/checkout/#/orderfrom')

            log('Estableciendo variables...', identity=identity)
            card_number = parser.get('payment_process', 'card_number')
            card_owner_name = parser.get('payment_process', 'card_owner_name')
            card_expiration_month = int(parser.get('payment_process', 'card_expiration_month'))
            card_expiration_year = int(parser.get('payment_process', 'card_expiration_year'))
            cvv = parser.get('payment_process', 'cvv')
            card_owner_run = parser.get('payment_process', 'card_owner_run')

            log('Seleccionando pago con tarjeta de credito.', identity=identity)
            wd.find_element(By.ID, 'payment-group-creditCardPaymentGroup').click()
            log('Cambiando focus a zona de pago.', identity=identity)
            wd.switch_to.frame(wd.find_element(By.XPATH, '//iframe[@class="span12"]'))
            WebDriverWait(wd, elements_timeout_limit).until(ec.presence_of_element_located((By.XPATH, '//div[@class="CardForm"]')))
            log('Llenando numero de cuotas.', identity=identity)
            time.sleep(1)
            wd.find_element(By.ID, 'creditCardpayment-card-0Brand').send_keys('Total')
            log('Llenando mes de vencimiento de tarjeta.', identity=identity)
            for i in range(card_expiration_month):
                wd.find_element(By.ID, 'creditCardpayment-card-0Month').send_keys(Keys.DOWN)
            log('Llenando anio de vencimiento de tarjeta.', identity=identity)
            card_expiration_year_first_value = int(wd.find_element(By.XPATH, '//select[@id="creditCardpayment-card-0Year"]//option[2]').text)
            card_expiration_year_difference = card_expiration_year - card_expiration_year_first_value
            for i in range(card_expiration_year_difference + 1):
                wd.find_element(By.ID, 'creditCardpayment-card-0Year').send_keys(Keys.DOWN)
            log('Llenando numero de tarjeta.', identity=identity)
            time.sleep(0.1)
            wd.find_element(By.ID, 'creditCardpayment-card-0Number').click()
            wd.find_element(By.ID, 'creditCardpayment-card-0Number').send_keys(card_number)
            log('Llenando nombre y apellido del propietario de la tarjeta.', identity=identity)
            time.sleep(0.1)
            wd.find_element(By.ID, 'creditCardpayment-card-0Name').click()
            wd.find_element(By.ID, 'creditCardpayment-card-0Name').send_keys(card_owner_name)
            log('Llenando CVV.', identity=identity)
            time.sleep(0.1)
            wd.find_element(By.ID, 'creditCardpayment-card-0Code').click()
            wd.find_element(By.ID, 'creditCardpayment-card-0Code').send_keys(cvv)
            log('Llenando rut del propietario de la tarjeta.', identity=identity)
            time.sleep(0.1)
            wd.find_element(By.ID, 'holder-document-0').click()
            wd.find_element(By.ID, 'holder-document-0').send_keys(card_owner_run)

            log('Cambiando el focus a la pagina principal.', identity=identity)
            wd.switch_to.default_content()

            time.sleep(1)
            if wd.current_url == 'https://www.nike.cl/checkout/#/payment':
                log('Cambiando focus a zona de pago.', identity=identity)
                wd.switch_to.frame(wd.find_element(By.XPATH, '//iframe[@class="span12"]'))
                if len(wd.find_element(By.ID, 'creditCardpayment-card-0Brand').find_elements(By.TAG_NAME, 'option')) != 1:
                    wd.find_element(By.ID, 'creditCardpayment-card-0Brand').send_keys('Total')
                    break
            log('Cambiando el focus a la pagina principal.', identity=identity)
            wd.switch_to.default_content()
        except Exception as e:
            log(str(e), 40, identity=identity)

    log('Cambiando el focus a la pagina principal.', identity=identity)
    wd.switch_to.default_content()
    wd.find_element(By.XPATH, '//button[@id=\'payment-data-submit\'][2]').click()
    purchase_alert()
    log('El proceso de compra se ha finalizado exitosamente.', identity=identity)

if __name__ == '__main__':
    globals()[sys.argv[1]](sys.argv[2], sys.argv[3], sys.argv[4])
