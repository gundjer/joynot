<?php

use App\Games\GameRegistry;
use App\Models\Kid;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;

// This router is only for the explicitly launched local browser test server.
if (PHP_SAPI === 'cli-server') {
    $asset = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if ($asset !== '/' && is_file(__DIR__.'/../../public'.$asset)) {
        return false;
    }
}

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
$database = __DIR__.'/../../storage/testing/smoke.sqlite';
config([
    'database.default' => 'sqlite',
    'database.connections.sqlite.database' => $database,
    'app.url' => 'http://127.0.0.1:8766',
    'session.driver' => 'file',
    'session.secure' => false,
]);

if (PHP_SAPI === 'cli-server') {
    Route::middleware('web')->get('/__test/login', function () {
        Auth::loginUsingId(1);
        session(['grownups_unlocked_at' => time()]);

        return 'ok';
    });
    $app->handleRequest(Request::capture());
} elseif (PHP_SAPI === 'cli') {
    if (! is_dir(dirname($database))) {
        mkdir(dirname($database), 0777, true);
    }
    touch($database);
    Artisan::call('migrate:fresh', ['--force' => true]);
    $user = User::factory()->create(['parent_pin' => Hash::make('1234')]);
    $kid = Kid::create([
        'user_id' => $user->id, 'name' => 'Smoke Test', 'avatar' => '🐝',
        'color' => '#3dd6a3', 'grade' => 'K',
    ]);
    foreach (app(GameRegistry::class)->all() as $game) {
        $kid->progressFor($game->key())->update([
            'state' => ['settings' => ['talk' => 'on', 'video' => 'on']],
        ]);
    }
    echo json_encode(['kid' => $kid->id, 'games' => app(GameRegistry::class)->all()->keys()->all()]);
}
