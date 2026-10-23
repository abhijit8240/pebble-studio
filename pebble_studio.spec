# Build with: pyinstaller pebble_studio.spec
#
# This list of hiddenimports covers every library the app actually loads (confirmed by
# grepping the real import statements, not guessed) — but PyInstaller's static analysis can
# still occasionally miss one, especially for newer packages like google-genai. If the built
# exe fails at startup with "ModuleNotFoundError: No module named 'X'", add 'X' to the list
# below and rebuild. This has not been run end-to-end (no Windows machine available where
# this was written), so treat the first build as a real test, not a guaranteed success.
#
# python-docx also ships a non-Python resource file (a blank .docx template used whenever a
# brand-new document is created) that PyInstaller's automatic bundling doesn't catch on its
# own, since it only looks for .py modules — collect_data_files pulls that in explicitly.

from PyInstaller.utils.hooks import collect_data_files

docx_datas = collect_data_files('docx')

block_cipher = None

a = Analysis(
    ['desktop.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('templates', 'templates'),
        ('static', 'static'),
    ] + docx_datas,
    hiddenimports=[
        'anthropic',
        'google.genai',
        'google.genai.types',
        'openpyxl',
        'docx',
        'docx.oxml',
        'docx.text.paragraph',
        'docx.enum.text',
        'docx.shared',
        'PIL',
        'PIL.Image',
        'pypdf',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    cipher=block_cipher,
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='Studio',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # set True temporarily if you need to see startup errors while testing
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)
