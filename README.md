# snkrmon v2.3.3
## Control de versiones
### v2.3.3 - Corrección de bug
    - Se selecciona como metodo de pago, la tarjeta de credito antes de rellenar los datos.
### v2.3.2 - Corrección de bug
    - Se elimina bug que ejecutaba la aplicación con puertos bloqueados igualmente al encontrar al menos un puerto disponible en el listado de puertos a revisar.
### v2.3.1 - Corrección de bug congelamiento de ventanas en el back
    - Se modifica el tamaño inicial de la ventana en la configuración.
    - Se elimina el minimizar y maximizar ventana al finalizar el proceso de compra.
    - Se utilizan multiples consolas para cada uno de los procesos de forma independiente
### v2.3.0 - Multiples SKU
    - Se permite establecer un SKU individual para cada usuario.
### v2.2.1 - Eliminación de datos redundantes al instalar
    - Se eliminan los archivos .py al realizar el despliegue.
    - Se quita el icono del run.exe.
### v2.2.0 - Mejoras
    - Se añaden más usuario para tener un total de 15.
    - Se modifica la configuracion avanzada de la interfaz de usuario para tener el total de usuarios y puertos.
### v2.1.0 - Mejoras
    - Se establece el valor por defecto de la cantidad de usuarios en 1.
    - Al ejecutar pyinstaller.py se ignoran los archivos que no se utilizaran en cada uno de los ejecutables.
### v2.0.0 - Multiples usuarios
    - Se añade el uso de multiples usuarios (Máx. 5).
    - Se agrega la identidad del usuario al log.
    - Interfaz grafica actualizada para la configuración de multiples usuarios.
    - Actualización en el sistema de versionado (Versionado semántico).
### v1.1.0 - Se finaliza la compra
    - Al finalizar con el ciclo de compra, se hace click en finalizar compra.
### v1.0.9 - La extensión auto-refresh se instala manualmente
    - La extensión debe ser instalada manualmente debido a problemas con la instalación automatica.
    - En caso de no tener agregada la extensión, se procede con los pasos de instalación.
### v1.0.8 - Se agrega larma al finalizar el proceso de pago
    - En lugar de presionar el boton de finalizar la compra, suena una alarma indicando que el proceso se a completado exitosamente.
    - Se agrega la configuración del nombre de la alarma a la configuracion avanzada.
    - Se agrega un tiempo de espera de 0.1s al llenar los campos de pago.
    - Corrección de bug que ejecutaba la aplicación al cerrar la interfaz gráfica.
### v1.0.7 - Se agrega automaticamente auto-refresh
    - Si no existe un archivo de chrome_files, se genera automaticamente con la extension auto-refresh.
### v1.0.6 - Se agrega la extension auto-refresh
    - Se modifico la estructura para funcionar con la extension auto-refresh.
    - Se agrega la carpeta de chrome a los archivos de salida.
    - Se hace una segunda verificacion del numero de cuotas.
### v1.0.5 - Version ejecutable
    - Ahora se ejecuta por medio de un ".exe".
    - Se agrega la extension .log a los archivos de logs.
### v1.0.4 - Actualizacion
    - Se agrego una caja de mensaje emergente para la validacion de inicio de sesion.
### v1.0.3 - Actualizacion
    - Si se encuentra algun error durante el proceso de compra, se reinicia todo el proceso.
    - Se agregaron tiempos de espera preventivos para evitar errores en el ingreso de datos.
    - Se agregaron validadores para verificar que se haya completado el proceso de datos de pago exitosamente.
### v1.0.2 - Se añadio interfaz de usuario
    - Se agrego una interaz de usuario.
    - Los directorios requeridos se crean automaticamente si no existen.
### v1.0.1 - Solucion de errores
    - Solucion al bug de numero de tarjeta incompleto.
### v1.0.0 - Primera actualización
    - Primera version funcional.
