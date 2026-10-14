<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\CoopController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Grownups\ChatController;
use App\Http\Controllers\Grownups\GameSettingsController;
use App\Http\Controllers\Grownups\GrownupsController;
use App\Http\Controllers\Grownups\KidController;
use App\Http\Controllers\Grownups\PinController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\PlayController;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');

// ---------------------------------------------------------------- legal pages (public, linked in the footer)
Route::view('/terms', 'legal.terms')->name('legal.terms');
Route::view('/privacy', 'legal.privacy')->name('legal.privacy');
Route::view('/cookies', 'legal.cookies')->name('legal.cookies');
Route::view('/donations', 'legal.donations')->name('legal.donations');
Route::view('/contact', 'legal.contact')->name('legal.contact');

// ---------------------------------------------------------------- parent accounts
Route::middleware('guest')->group(function () {
    Route::get('/register', [RegisterController::class, 'show'])->name('register');
    Route::post('/register', [RegisterController::class, 'store'])->middleware('throttle:10,1');
    Route::get('/login', [LoginController::class, 'show'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);
    Route::get('/forgot-password', [PasswordResetController::class, 'request'])->name('password.request');
    Route::post('/forgot-password', [PasswordResetController::class, 'email'])->middleware('throttle:5,1')->name('password.email');
    Route::get('/reset-password/{token}', [PasswordResetController::class, 'edit'])->name('password.reset');
    Route::post('/reset-password', [PasswordResetController::class, 'update'])->name('password.update');
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');

    // ------------------------------------------------------------ kids side (no PIN)
    Route::get('/dashboard', [DashboardController::class, 'who'])->name('dashboard');
    Route::get('/kids/{kid}', [DashboardController::class, 'games'])->name('kid.games');

    Route::get('/play/{game}/{kid}', [PlayController::class, 'show'])->name('play');
    Route::get('/play/{game}/{kid}/progress', [PlayController::class, 'progress'])->name('play.progress');
    Route::post('/play/{game}/{kid}/progress', [PlayController::class, 'save'])->name('play.save');
    Route::post('/play/{game}/{kid}/attempts', [PlayController::class, 'attempts'])->name('play.attempts');

    // ------------------------------------------------------------ grown-ups play along (kid's game ↔ grown-ups' phones)
    Route::post('/play/{game}/{kid}/coop', [CoopController::class, 'host'])->name('coop.host');
    Route::get('/coop/live', [CoopController::class, 'live'])->name('coop.live');
    Route::get('/coop/{session}/poll', [CoopController::class, 'poll'])->whereNumber('session')->name('coop.poll');
    Route::post('/coop/{session}/send', [CoopController::class, 'send'])->whereNumber('session')->name('coop.send');
    Route::post('/coop/{session}/end', [CoopController::class, 'end'])->whereNumber('session')->name('coop.end');
    Route::post('/coop/{session}/chat', [CoopController::class, 'chat'])->whereNumber('session')->name('coop.chat');
    Route::post('/coop/{session}/voice', [CoopController::class, 'voiceUpload'])->whereNumber('session')->name('coop.voice');
    Route::get('/coop/{session}/voice/{file}', [CoopController::class, 'voiceGet'])->whereNumber('session')->where('file', '[A-Za-z0-9]{20}\.(webm|mp4|ogg|m4a)')->name('coop.voice.get');

    // ------------------------------------------------------------ grown-ups PIN
    Route::get('/grown-ups/unlock', [PinController::class, 'unlockForm'])->name('grownups.unlock');
    Route::post('/grown-ups/unlock', [PinController::class, 'unlock'])->middleware('throttle:10,1');
    Route::post('/grown-ups/lock', [PinController::class, 'lock'])->name('grownups.lock');
    Route::get('/grown-ups/pin/setup', [PinController::class, 'setupForm'])->name('grownups.pin.setup');
    Route::post('/grown-ups/pin/setup', [PinController::class, 'setup'])->middleware('throttle:10,1');

    // ------------------------------------------------------------ grown-ups area (PIN unlocked)
    Route::middleware('grownups')->prefix('grown-ups')->name('grownups.')->group(function () {
        Route::get('/', [GrownupsController::class, 'index'])->name('index');
        Route::get('/account', [GrownupsController::class, 'account'])->name('account');
        Route::post('/pin', [PinController::class, 'change'])->name('pin.change');

        Route::get('/kids/new', [KidController::class, 'create'])->name('kids.create');
        Route::post('/kids', [KidController::class, 'store'])->name('kids.store');
        Route::post('/kids/order', [KidController::class, 'order'])->name('kids.order');
        Route::get('/kids/{kid}', [KidController::class, 'edit'])->whereNumber('kid')->name('kids.edit');
        Route::put('/kids/{kid}', [KidController::class, 'update'])->name('kids.update');
        Route::delete('/kids/{kid}', [KidController::class, 'destroy'])->name('kids.destroy');

        Route::get('/kids/{kid}/games/{game}', [GameSettingsController::class, 'show'])->name('games.show');
        Route::put('/kids/{kid}/games/{game}', [GameSettingsController::class, 'update'])->name('games.update');
        Route::post('/kids/{kid}/games/{game}/reset', [GameSettingsController::class, 'reset'])->name('games.reset');

        // saved chat (grown-ups can delete it)
        Route::delete('/kids/{kid}/chats/{chat}', [ChatController::class, 'destroy'])->whereNumber('chat')->name('chats.destroy');
        Route::delete('/kids/{kid}/games/{game}/chats', [ChatController::class, 'destroyAll'])->name('chats.destroyAll');

        // join a kid's game as a helper (only from the PIN-unlocked area)
        Route::get('/join/{session}', [CoopController::class, 'join'])->whereNumber('session')->name('coop.join');
        Route::post('/join/{session}', [CoopController::class, 'member'])->whereNumber('session')->name('coop.member');
    });
});
