import os
with open('README.md') as f:
    lines = f.read()
    first_line = lines.split('\n', 1)[0]
    version = first_line.split(' ')[-1]

os.system('pyinstaller main.py -n snkrmon-' + version + ' --icon=icon.ico --specpath=specs --add-data=config.ini;. --add-data=icon.ico;. --noconfirm')
