use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;

protected $listen = [
    Registered::class => [
        SendEmailVerificationNotification::class,
    ],
];
