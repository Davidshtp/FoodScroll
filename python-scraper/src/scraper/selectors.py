RUNT_URL = 'https://portalpublico.runt.gov.co/#/consulta-vehiculo/consulta/consulta-ciudadana'

RUNT_SELECTORS = {
    'plate_input': 'input[formcontrolname="placa"]',
    'document_input': 'input[formcontrolname="documento"]',
    'captcha_input': 'input[formcontrolname="captcha"]',
    'captcha_image': 'img[src^="data:image"]',
    'submit_button': 'button:has-text("Consultar")',
    'document_type_select': 'mat-select:nth-of-type(3)',
}
