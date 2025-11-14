public function register(): void
{
    $this->renderable(function (\Illuminate\Auth\AuthenticationException $e, $request) {
        if ($request->is('api/*')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated. Please login first.',
            ], 401);
        }
    });
}