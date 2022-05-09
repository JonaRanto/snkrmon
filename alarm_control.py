from selenium.webdriver.chrome.webdriver import WebDriver
import winsound
from configparser import ConfigParser

parser = ConfigParser()
parser.read('config.ini')

alarm_repeats = 3
alarm_file = parser.get('files', 'alarm_filename')

def purchase_alert(wd: WebDriver):
    wd.minimize_window()
    wd.maximize_window()
    for _ in range(alarm_repeats):
        winsound.PlaySound(alarm_file, winsound.SND_FILENAME)
