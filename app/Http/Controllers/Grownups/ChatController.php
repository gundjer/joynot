<?php

namespace App\Http\Controllers\Grownups;

use App\Http\Controllers\Concerns\FindsFamilyRecords;
use App\Http\Controllers\Controller;
use App\Models\ChatMessage;
use Illuminate\Http\Request;

/** Grown-ups: delete saved chat messages (one, or all for a game). */
class ChatController extends Controller
{
    use FindsFamilyRecords;

    public function destroy(Request $request, $kid, $chat)
    {
        $kid = $this->familyKid($request, $kid);
        $msg = ChatMessage::where('kid_id', $kid->id)->where('user_id', $request->user()->id)->findOrFail((int) $chat);
        $game = $msg->game;
        $msg->delete();

        return redirect()->to(route('grownups.kids.edit', $kid->id).'#chat-'.$game)->with('status', 'Message deleted.');
    }

    public function destroyAll(Request $request, $kid, $game)
    {
        $kid = $this->familyKid($request, $kid);
        $n = ChatMessage::where('kid_id', $kid->id)->where('user_id', $request->user()->id)->where('game', $game)->delete();

        return redirect()->to(route('grownups.kids.edit', $kid->id).'#chat-'.$game)->with('status', "Deleted {$n} ".($n === 1 ? 'message' : 'messages').'.');
    }
}
