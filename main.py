import os
import subprocess
from configparser import ConfigParser
from socket import AF_INET, SOCK_STREAM, socket

from gui import gui
from log_control import log

while True:
    gui_return = gui()

    parser = ConfigParser()
    parser.read('config.ini')

    users_quantity = gui_return['users_quantity']

    for n in range(users_quantity):
        this_user_number = str(n + 1)

        port = parser.get('other', 'chrome_port_' + this_user_number)
        chrome_files = parser.get('dirs', 'chrome_files_dir_' + this_user_number)

        if not os.path.isdir(parser.get('dirs', 'chrome_files_dir_' + this_user_number)):
            os.makedirs(parser.get('dirs', 'chrome_files_dir_' + this_user_number))

        busy_port = False

        log('Verificando estado de puerto.')
        try:
            try:
                s = socket(AF_INET, SOCK_STREAM, 0)
            except:
                log('No se puede abrir el socket.', 40)
            s.connect(('localhost', int(port)))
            connected  = True
        except:
            connected = False
        finally:
            if connected:
                log('El puerto ' + port + ' ya se encuentra ocupado.', 40)
                busy_port = True
            
    if busy_port == False:
        break
    else:
        exit()

for i in range(users_quantity):
    this_user_number = str(i + 1)

    sku = parser.get('other', 'sku_' + this_user_number)
    port = parser.get('other', 'chrome_port_' + this_user_number)
    chrome_files = parser.get('dirs', 'chrome_files_dir_' + this_user_number)
    #subprocess.Popen(['dist/snkrmon-v2.3.1/run.exe', 'purchase', sku, port, chrome_files], creationflags=subprocess.CREATE_NEW_CONSOLE)
    subprocess.Popen(['run.exe', 'purchase', sku, port, chrome_files], creationflags=subprocess.CREATE_NEW_CONSOLE)
log('Se han finalizado todos los procesos.')
input('')
