from asyncio.windows_events import NULL
import logging
from configparser import ConfigParser
from datetime import datetime
import os

parser = ConfigParser()
parser.read('config.ini')

if not os.path.isdir(parser.get('dirs', 'log_dir')):
    os.makedirs(parser.get('dirs', 'log_dir'))

def log(log: str, lvl: int = 10, identity: str = NULL):
    ''' 
    Se recibe un log y un nivel de log.

    Log lvl:
    10: Debug
    20: Info
    30: Warning
    40: Error
    50: Critical
     '''
    FILENAME = parser.get('dirs', 'log_dir') + datetime.utcnow().strftime('%Y-%m-%d') + '.log'
    FORMAT = str(datetime.utcnow()) + '(%(levelname)s): %(message)s'
    logging.basicConfig(filename=FILENAME, level=lvl, format=FORMAT)
    if identity != NULL:
        if lvl == 10:
            msg = '(' + identity + ')' + ' Debug: ' + log
            logging.debug('(' + identity + ')' + log)
        if lvl == 20:
            msg = '(' + identity + ')' + ' Info: ' + log
            logging.info('(' + identity + ')' + log)
        if lvl == 30:
            msg = '(' + identity + ')' + ' Warning: ' + log
            logging.warning('(' + identity + ')' + log)
        if lvl == 40:
            msg = '(' + identity + ')' + ' Error: ' + log
            logging.error('(' + identity + ')' + log)
        if lvl == 50:
            msg = '(' + identity + ')' + ' Critical: ' + log
            logging.critical('(' + identity + ')' + log)
    else:
        if lvl == 10:
            msg = 'Debug: ' + log
            logging.debug(log)
        if lvl == 20:
            msg = 'Info: ' + log
            logging.info(log)
        if lvl == 30:
            msg = 'Warning: ' + log
            logging.warning(log)
        if lvl == 40:
            msg = 'Error: ' + log
            logging.error(log)
        if lvl == 50:
            msg = 'Critical: ' + log
            logging.critical(log)
            
    print(msg)
