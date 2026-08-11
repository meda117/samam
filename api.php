<?php
declare(strict_types=1);

/* Change this password before uploading the site. Keep this file on a PHP-enabled host. */
const ADMIN_PASSWORD = '123456';

session_name('samam_admin_session');
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Samam-Api: 1');

$action = $_GET['action'] ?? '';
$dataDirectory = __DIR__ . DIRECTORY_SEPARATOR . 'data';
$dataFile = $dataDirectory . DIRECTORY_SEPARATOR . 'restaurant.json';
$uploadsDirectory = __DIR__ . DIRECTORY_SEPARATOR . 'uploads';

function respond(array $payload, int $status = 200): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function isAdmin(): bool {
    return !empty($_SESSION['samam_admin']);
}

function requireAdmin(): void {
    if (!isAdmin()) {
        respond(['ok' => false, 'error' => 'غير مصرح لك بالدخول.'], 401);
    }
}

function requestJson(): array {
    $body = json_decode(file_get_contents('php://input'), true);
    return is_array($body) ? $body : [];
}

if ($action === 'state') {
    $state = null;
    if (is_file($dataFile)) {
        $content = file_get_contents($dataFile);
        $decoded = json_decode($content ?: '', true);
        if (is_array($decoded)) {
            $state = $decoded;
        }
    }
    respond(['ok' => true, 'state' => $state]);
}

if ($action === 'session') {
    respond(['ok' => true, 'authenticated' => isAdmin()]);
}

if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = requestJson();
    $password = (string)($payload['password'] ?? '');
    if (!hash_equals(ADMIN_PASSWORD, $password)) {
        respond(['ok' => false, 'error' => 'كلمة المرور غير صحيحة.'], 401);
    }
    session_regenerate_id(true);
    $_SESSION['samam_admin'] = true;
    respond(['ok' => true]);
}

if ($action === 'logout' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $_SESSION = [];
    session_destroy();
    respond(['ok' => true]);
}

if ($action === 'save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requireAdmin();
    $state = requestJson();
    if (!isset($state['business']) || !is_array($state['business']) || !isset($state['products']) || !is_array($state['products'])) {
        respond(['ok' => false, 'error' => 'صيغة البيانات غير صحيحة.'], 422);
    }
    if (!is_dir($dataDirectory) && !mkdir($dataDirectory, 0755, true) && !is_dir($dataDirectory)) {
        respond(['ok' => false, 'error' => 'تعذر إنشاء مجلد البيانات.'], 500);
    }
    $encoded = json_encode($state, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($encoded === false || file_put_contents($dataFile, $encoded . PHP_EOL, LOCK_EX) === false) {
        respond(['ok' => false, 'error' => 'تعذر حفظ بيانات الموقع. تأكد من صلاحية الكتابة لمجلد data.'], 500);
    }
    respond(['ok' => true]);
}

if ($action === 'upload' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requireAdmin();
    if (!isset($_FILES['image']) || !is_array($_FILES['image']) || ($_FILES['image']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        respond(['ok' => false, 'error' => 'لم يتم استلام الصورة بشكل صحيح.'], 422);
    }
    $image = $_FILES['image'];
    if (($image['size'] ?? 0) > 5 * 1024 * 1024) {
        respond(['ok' => false, 'error' => 'أقصى حجم للصورة هو 5 ميجابايت.'], 422);
    }
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($image['tmp_name']);
    $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
    if (!isset($extensions[$mime])) {
        respond(['ok' => false, 'error' => 'صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WEBP أو GIF.'], 422);
    }
    if (!is_dir($uploadsDirectory) && !mkdir($uploadsDirectory, 0755, true) && !is_dir($uploadsDirectory)) {
        respond(['ok' => false, 'error' => 'تعذر إنشاء مجلد الصور.'], 500);
    }
    $filename = 'product-' . date('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.' . $extensions[$mime];
    if (!move_uploaded_file($image['tmp_name'], $uploadsDirectory . DIRECTORY_SEPARATOR . $filename)) {
        respond(['ok' => false, 'error' => 'تعذر حفظ الصورة في مجلد uploads.'], 500);
    }
    respond(['ok' => true, 'path' => 'uploads/' . $filename]);
}

respond(['ok' => false, 'error' => 'طلب غير معروف.'], 404);
