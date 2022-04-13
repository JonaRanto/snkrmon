from log_control import log
from configparser import ConfigParser
import subprocess, os

from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.common.exceptions import SessionNotCreatedException
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

parser = ConfigParser()
parser.read('config.ini')

def wd_conn():
    from selenium import webdriver as wd

    log('Estableciendo variables de Chrome...')
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

    log('Estableciendo "Browser Target"...')
    config_chrome.add_experimental_option('debuggerAddress', 'localhost:' + port)

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
    return wd