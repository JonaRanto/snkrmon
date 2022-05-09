from log_control import log
import subprocess

from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.common.exceptions import SessionNotCreatedException
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

def wd_conn(chrome_path, chrome_filename, port, chrome_files, current_path, window_size):
    from selenium import webdriver as wd
    cmd = '"' + chrome_path + chrome_filename + '"' + ' --remote-debugging-port=' + port + ' --user-data-dir=' + '"' + current_path + chrome_files + '" --window_size=' + window_size
    
    log('Abriendo Chrome...', 20)
    subprocess.Popen(cmd)

    log('Configurando WebDriver...', 20)
    config_chrome = wd.ChromeOptions()

    log('Estableciendo "Browser Target"...')    # Se utiliza un explorador ya abierto para que no se detecte como software de automatización
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
