<?php
// upload.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Habilitar exibição de erros para debug
error_reporting(E_ALL);
ini_set('display_errors', 0); // Desativado para não quebrar o JSON em caso de Warning
 
// Configurações
$uploadDir = __DIR__ . '/dados/';
$allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
$maxFileSize = 5 * 1024 * 1024; // 5MB

// Criar diretório se não existir
if (!file_exists($uploadDir)) {
    if (!mkdir($uploadDir, 0777, true)) {
        echo json_encode([
            'success' => false,
            'error' => 'Não foi possível criar o diretório de uploads: ' . $uploadDir
        ]);
        exit;
    }
}

// Verificar se o diretório tem permissão de escrita
if (!is_writable($uploadDir)) {
    echo json_encode([
        'success' => false,
        'error' => 'Diretório sem permissão de escrita: ' . $uploadDir . ' (CHMOD 755 ou 777)'
    ]);
    exit;
}

// Processar upload
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Log do recebimento
        error_log("Upload recebido: " . print_r($_FILES, true));
        error_log("POST data: " . print_r($_POST, true));
        
        // Verificar se arquivo foi enviado
        if (!isset($_FILES['animation'])) {
            throw new Exception('Nenhum arquivo enviado');
        }
        
        $file = $_FILES['animation'];
        $animationType = $_POST['animation_type'] ?? '';
        $direction = $_POST['direction'] ?? '';
        
        // Validar campos obrigatórios
        if (empty($animationType)) {
            throw new Exception('Tipo de animação não especificado');
        }
        
        if (empty($direction)) {
            throw new Exception('Direção não especificada');
        }
        
        // Validar erros de upload
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $uploadErrors = [
                UPLOAD_ERR_INI_SIZE => 'Arquivo maior que o permitido pelo PHP',
                UPLOAD_ERR_FORM_SIZE => 'Arquivo maior que o permitido pelo formulário',
                UPLOAD_ERR_PARTIAL => 'Upload parcialmente concluído',
                UPLOAD_ERR_NO_FILE => 'Nenhum arquivo foi enviado',
                UPLOAD_ERR_NO_TMP_DIR => 'Pasta temporária não encontrada',
                UPLOAD_ERR_CANT_WRITE => 'Falha ao escrever o arquivo no disco',
                UPLOAD_ERR_EXTENSION => 'Upload bloqueado por extensão PHP'
            ];
            $errorMsg = $uploadErrors[$file['error']] ?? 'Erro desconhecido no upload';
            throw new Exception('Erro no upload: ' . $errorMsg);
        }
        
        // Validar tipo de arquivo
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $fileType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        if (!in_array($fileType, $allowedTypes)) {
            throw new Exception('Tipo de arquivo não permitido. Use PNG, JPG ou JPEG. Recebido: ' . $fileType);
        }
        
        // Validar tamanho
        if ($file['size'] > $maxFileSize) {
            throw new Exception('Arquivo muito grande. Máximo: 5MB. Tamanho: ' . round($file['size'] / 1024 / 1024, 2) . 'MB');
        }
        
        // Mapeamento de tipos de animação e direções
        $animationMap = [
            'walk' => [
                'dir0' => 'w_down.png',
                'dir1' => 'w_down_left.png',
                'dir2' => 'w_left.png',
                'dir3' => 'w_up_left.png',
                'dir4' => 'w_up.png',
                'dir5' => 'w_up_right.png',
                'dir6' => 'w_right.png',
                'dir7' => 'w_down_right.png'
            ],
            'idle' => [
                'dir0' => 'i_down.png',
                'dir1' => 'i_down_left.png',
                'dir2' => 'i_left.png',
                'dir3' => 'i_up_left.png',
                'dir4' => 'i_up.png',
                'dir5' => 'i_up_right.png',
                'dir6' => 'i_right.png',
                'dir7' => 'i_down_right.png'
            ],
            'shoot' => [
                'dir0' => 's_down.png',
                'dir1' => 's_down_left.png',
                'dir2' => 's_left.png',
                'dir3' => 's_up_left.png',
                'dir4' => 's_up.png',
                'dir5' => 's_up_right.png',
                'dir6' => 's_right.png',
                'dir7' => 's_down_right.png'
            ]
        ];
        
        // Verificar se a combinação é válida
        if (!isset($animationMap[$animationType][$direction])) {
            throw new Exception('Combinação inválida de animação e direção: ' . $animationType . ' - ' . $direction);
        }
        
        // Nome do arquivo de destino
        $filename = $animationMap[$animationType][$direction];
        $destination = $uploadDir . $filename;
        
        // Backup do arquivo antigo
        if (file_exists($destination)) {
            $backupDir = $uploadDir . 'backup/';
            if (!file_exists($backupDir)) {
                mkdir($backupDir, 0777, true);
            }
            $backupFile = $backupDir . date('Y-m-d_H-i-s') . '_' . $filename;
            if (copy($destination, $backupFile)) {
                error_log("Backup criado: " . $backupFile);
            } else {
                error_log("Falha ao criar backup de: " . $destination);
            }
        }
        
        // Salvar novo arquivo
        if (move_uploaded_file($file['tmp_name'], $destination)) {
            // Gerar informações do arquivo
            $imageInfo = getimagesize($destination);
            
            echo json_encode([
                'success' => true,
                'message' => 'Upload realizado com sucesso!',
                'file' => $filename,
                'type' => $animationType,
                'direction' => $direction,
                'dimensions' => [
                    'width' => $imageInfo[0],
                    'height' => $imageInfo[1]
                ],
                'timestamp' => date('Y-m-d H:i:s'),
                'path' => $destination
            ]);
        } else {
            throw new Exception('Erro ao salvar o arquivo no destino: ' . $destination);
        }
        
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage(),
            'debug' => [
                'upload_dir' => $uploadDir,
                'is_writable' => is_writable($uploadDir),
                'post_data' => $_POST,
                'files_data' => isset($_FILES['animation']) ? [
                    'name' => $_FILES['animation']['name'],
                    'type' => $_FILES['animation']['type'],
                    'size' => $_FILES['animation']['size'],
                    'error' => $_FILES['animation']['error']
                ] : null
            ]
        ]);
    }
    
    exit;
}

// Resetar projeto (apagar arquivos)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'reset') {
    try {
        $it = new RecursiveDirectoryIterator($uploadDir, RecursiveDirectoryIterator::SKIP_DOTS);
        $files = new RecursiveIteratorIterator($it, RecursiveIteratorIterator::CHILD_FIRST);
        foreach($files as $file) {
            if ($file->isDir()) rmdir($file->getRealPath());
            else unlink($file->getRealPath());
        }
        echo json_encode(['success' => true, 'message' => 'Projeto resetado com sucesso!']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// Listar arquivos existentes (opcional)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'list') {
    $files = [];
    $patterns = [
        'walk' => 'w_*.png',
        'idle' => 'i_*.png',
        'shoot' => 's_*.png'
    ];
    
    foreach ($patterns as $type => $pattern) {
        $found = glob($uploadDir . $pattern);
        $files[$type] = $found !== false ? $found : [];
        $files[$type] = array_map(function($file) use ($uploadDir) {
            return basename($file);
        }, $files[$type]);
    }
    
    echo json_encode([
        'success' => true,
        'files' => $files,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit;
}

// Se não for POST nem GET com action, mostrar página HTML de teste
?>
<!DOCTYPE html>
<html>
<head>
    <title>Upload PHP - Teste</title>
    <style>
        body {
            font-family: monospace;
            padding: 20px;
            background: #2c3e50;
            color: white;
        }
        .success {
            background: #27ae60;
            padding: 10px;
            border-radius: 5px;
        }
        .error {
            background: #e74c3c;
            padding: 10px;
            border-radius: 5px;
        }
        pre {
            background: #34495e;
            padding: 10px;
            border-radius: 5px;
            overflow: auto;
        }
    </style>
</head>
<body>
    <h1>📁 Upload PHP - Status</h1>
    
    <h2>Configuração:</h2>
    <pre>
Diretório de upload: <?php echo $uploadDir; ?>
Permissão de escrita: <?php echo is_writable($uploadDir) ? '✅ Sim' : '❌ Não'; ?>
Tamanho máximo: <?php echo round($maxFileSize / 1024 / 1024, 2); ?> MB
    </pre>
    
    <h2>Teste rápido:</h2>
    <form method="POST" enctype="multipart/form-data">
        <input type="hidden" name="animation_type" value="walk">
        <input type="hidden" name="direction" value="dir0">
        <input type="file" name="animation" accept="image/png,image/jpeg">
        <button type="submit">Testar Upload</button>
    </form>
    
    <?php
    // Se for POST sem AJAX (teste direto)
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && !isset($_SERVER['HTTP_X_REQUESTED_WITH'])) {
        echo "<h2>Resultado do teste:</h2>";
        
        if (isset($_FILES['animation']) && $_FILES['animation']['error'] === UPLOAD_ERR_OK) {
            $testFile = $_FILES['animation'];
            $testDestination = $uploadDir . 'test_' . time() . '.png';
            
            if (move_uploaded_file($testFile['tmp_name'], $testDestination)) {
                echo "<div class='success'>✅ Upload de teste bem sucedido!</div>";
                echo "<p>Arquivo salvo em: " . $testDestination . "</p>";
                unlink($testDestination); // Remove arquivo de teste
            } else {
                echo "<div class='error'>❌ Falha ao salvar arquivo de teste</div>";
            }
        } else {
            echo "<div class='error'>❌ Nenhum arquivo selecionado ou erro no upload</div>";
        }
    }
    ?>
    
    <h2>Debug Info:</h2>
    <pre>
PHP Version: <?php echo phpversion(); ?>
Upload Max Filesize: <?php echo ini_get('upload_max_filesize'); ?>
Post Max Size: <?php echo ini_get('post_max_size'); ?>
Server Software: <?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'; ?>
Document Root: <?php echo $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown'; ?>
    </pre>
</body>
</html>
<?php
exit;
?>
