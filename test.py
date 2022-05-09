from selenium import webdriver as wd
from log_control import log
import subprocess, os
from configparser import ConfigParser
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.common.exceptions import SessionNotCreatedException

parser = ConfigParser()
parser.read('config.ini')

chrome_path = parser.get('paths', 'chrome_path')
chrome_filename = parser.get('files', 'chrome_filename')
port = parser.get('other', 'chrome_port')
chrome_files = parser.get('dirs', 'chrome_files_dir')
current_path = os.getcwd() + '\\'
window_size = parser.get('other', 'window_width') + ',' + parser.get('other', 'window_height')

cmd = '"' + chrome_path + chrome_filename + '"' + ' --remote-debugging-port=' + port + ' --user-data-dir=' + '"' + current_path + chrome_files + '" --window_size=' + window_size

log('Abriendo Chrome...', 20)
subprocess.Popen(cmd)

log('Configurando WebDriver...', 20)
config_chrome = wd.ChromeOptions()

log('Estableciendo "Browser Target"...')    # Se utiliza un explorador ya abierto para que no se detecte como software de automatización
config_chrome.add_experimental_option('debuggerAddress', 'localhost:' + port)

config_chrome.add_extension('extension_5_4_0_0.crx')

caps = DesiredCapabilities.CHROME.copy()    # Se obtiene una copia de la configuracion por defecto de las caps de Chrome
caps["pageLoadStrategy"] = "eager"  # Establecer modo interactivo (No se espera a que la pagina termine de cargar para continuar con el codigo)
try:
    log('Ejecutando controlador de Chrome...', 20)
    wd = wd.Chrome(
        desired_capabilities=caps,  # Establecer el caps preconfigurado
        service=Service(ChromeDriverManager().install()),   # Utilizar chromedriver actualizado
        options=config_chrome)  # Establecer el uso de las opciones preconfiguradas
except SessionNotCreatedException:
    log('Version de ChromeDriver y Chrome no compatibles.', 50)



wd.get('chrome://extensions/')