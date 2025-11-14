use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\URL;

VerifyEmail::createUrlUsing(function ($notifiable) {
    return URL::temporarySignedRoute(
        'verification.verify',
        now()->addMinutes(5),
        [
            'id' => $notifiable->getKey(),
            'hash' => sha1($notifiable->getEmailForVerification()),
        ]
    );
});
