import os
import time

with open('README.md') as f:
    lines = f.read()
    first_line = lines.split('\n', 1)[0]
    version = first_line.split(' ')[-1]

current_path = os.getcwd()

os.system('pyinstaller main.py -n snkrmon-' + version + ' --specpath=specs --icon=' + current_path + '\icon.ico --exclude-module=alarm_control --exclude-module=auto_purchase --exclude-module=pyinstaller --exclude-module=wd --add-data=..\\config.ini;. --add-data=..\\icon.ico;. --add-data=..\\alarm.wav;. --add-data=..\\auto_purchase.py;. --add-data=..\\alarm_control.py;. --add-data=..\\log_control.py;. --add-data=..\\wd.py;. --noconfirm')

os.system('pyinstaller auto_purchase.py -n run --specpath=specs --icon=' + current_path + '\icon.ico --exclude-module=gui --exclude-module=main --exclude-module=pyinstaller --add-data=..\\config.ini;. --add-data=..\\icon.ico;. --add-data=..\\alarm.wav;. --add-data=..\\auto_purchase.py;. --add-data=..\\alarm_control.py;. --add-data=..\\log_control.py;. --add-data=..\\wd.py;. --noconfirm')

os.system('robocopy dist\\run dist\\snkrmon-' + version + ' /E')
