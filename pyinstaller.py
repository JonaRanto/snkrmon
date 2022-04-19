import os
with open('README.md') as f:
    lines = f.read()
    first_line = lines.split('\n', 1)[0]
    version = first_line.split(' ')[-1]

current_path = os.getcwd()

os.system('pyinstaller main.py -n snkrmon-' + version + ' --specpath=specs --icon=' + current_path + '\icon.ico --add-data=..\\config.ini;. --add-data=..\\icon.ico;. --noconfirm')
