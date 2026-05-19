from __future__ import annotations

# URL + selectores del portal publico RUNT (consulta por documento).
# Copiados del microservicio `python-scraper` para mantener consistencia.

RUNT_DOC_URL = 'https://portalpublico.runt.gov.co/#/consulta-ciudadano-documento/consulta/consulta-ciudadano-documento'

# Selectores del formulario de consulta por documento (cédula, etc.)
DOC_FORM_SELECTORS = {
    # Tipo de documento (mat-select o select).
    'document_type_select': 'mat-select[formcontrolname="tipoDocumento"], select[formcontrolname="tipoDocumento"]',
    # Campo de numero de documento.
    'document_input': 'input[formcontrolname="documento"]',
    # Imagen del captcha (data:image).
    'captcha_image': 'img[src^="data:image"]',
    # Input del captcha.
    'captcha_input': 'input[formcontrolname="captcha"]',
    # Boton para enviar la consulta.
    'submit_button': 'button:has-text("Consultar"), button[type="submit"]',
}

# Selectores de la tabla que muestra la informacion de la licencia de conduccion.
LICENSE_TABLE_SELECTOR = 'table[mat-table][role="table"]'
