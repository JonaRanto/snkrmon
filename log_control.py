import logging
from configparser import ConfigParser
from datetime import datetime

parser = ConfigParser()
parser.read('config.ini')

def log(log: str, lvl: int = 10):
    ''' 
    Se recibe un log y un nivel de log.

    Log lvl:
    10: Debug
    20: Info
    30: Warning
    40: Error
    50: Critical
     '''
    FILENAME = parser.get('dirs', 'log_dir') + datetime.utcnow().strftime('%Y-%m-%d')
    FORMAT = str(datetime.utcnow()) + '(%(levelname)s): %(message)s'
    logging.basicConfig(filename=FILENAME, level=lvl, format=FORMAT)
    if lvl == 10:
        print('Debug: ' + log)
        logging.debug(log)
    if lvl == 20:
        print('Info: ' + log)
        logging.info(log)
    if lvl == 30:
        print('Warning: ' + log)
        logging.warning(log)
    if lvl == 40:
        print('Error: ' + log)
        logging.error(log)
    if lvl == 50:
        print('Critical: ' + log)
        logging.critical(log)
