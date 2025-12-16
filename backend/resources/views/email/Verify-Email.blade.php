<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifikasi Email</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .email-container {
            background: white;
            max-width: 600px;
            width: 100%;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }
        
        .email-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        
        .logo-container {
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            width: 80px;
            height: 80px;
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid rgba(255, 255, 255, 0.3);
        }
        
        .logo-icon {
            font-size: 40px;
        }
        
        .email-header h1 {
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .email-header p {
            font-size: 16px;
            opacity: 0.95;
        }
        
        .email-body {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 18px;
            color: #1a202c;
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        .message {
            font-size: 16px;
            color: #4a5568;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        
        .verify-button-container {
            text-align: center;
            margin: 35px 0;
        }
        
        .verify-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 50px;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
            transition: all 0.3s ease;
        }
        
        .verify-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 40px rgba(102, 126, 234, 0.5);
        }
        
        .divider {
            border-top: 1px solid #e2e8f0;
            margin: 30px 0;
        }
        
        .alternative-text {
            font-size: 14px;
            color: #718096;
            margin-bottom: 15px;
        }
        
        .url-box {
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            word-break: break-all;
            font-size: 13px;
            color: #4a5568;
            margin-bottom: 30px;
        }
        
        .info-box {
            background: #fff5f5;
            border-left: 4px solid #f56565;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .info-box p {
            font-size: 14px;
            color: #742a2a;
            margin: 0;
        }
        
        .footer-text {
            font-size: 14px;
            color: #718096;
            line-height: 1.5;
        }
        
        .email-footer {
            background: #f7fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .email-footer p {
            font-size: 13px;
            color: #a0aec0;
            margin-bottom: 10px;
        }
        
        .social-links {
            margin-top: 15px;
        }
        
        .social-links a {
            color: #667eea;
            text-decoration: none;
            margin: 0 10px;
            font-size: 13px;
        }
        
        @media (max-width: 600px) {
            .email-body {
                padding: 30px 20px;
            }
            
            .email-header {
                padding: 30px 20px;
            }
            
            .verify-button {
                padding: 14px 35px;
                font-size: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="email-header">
            <div class="logo-container">
                <span class="logo-icon">📦</span>
            </div>
            <h1>Verifikasi Email Anda</h1>
            <p>Inventory Management System</p>
        </div>
        
        <!-- Body -->
        <div class="email-body">
            <p class="greeting">Halo, {{ $user->username ?? 'User' }}!</p>
            
            <p class="message">
                Terima kasih telah mendaftar di <strong>Inventory System</strong>. 
                Untuk melanjutkan dan mengakses semua fitur aplikasi, silakan verifikasi alamat email Anda dengan mengklik tombol di bawah ini:
            </p>
            
            <div class="verify-button-container">
                <a href="{{ $verificationUrl }}" class="verify-button">
                    ✓ Verifikasi Email Saya
                </a>
            </div>
            
            <div class="info-box">
                <p>
                    <strong>⚠️ Penting:</strong> Link verifikasi ini akan kadaluwarsa dalam 60 menit. 
                    Jika Anda tidak melakukan pendaftaran, abaikan email ini.
                </p>
            </div>
            
            <div class="divider"></div>
            
            <p class="alternative-text">
                Jika tombol di atas tidak berfungsi, salin dan tempel URL berikut ke browser Anda:
            </p>
            
            <div class="url-box">
                {{ $verificationUrl }}
            </div>
            
            <p class="footer-text">
                <strong>Butuh bantuan?</strong><br>
                Jika Anda mengalami masalah, silakan hubungi tim support kami di 
                <a href="mailto:support@inventorysystem.com" style="color: #667eea; text-decoration: none;">support@inventorysystem.com</a>
            </p>
        </div>
        
        <!-- Footer -->
        <div class="email-footer">
            <p>&copy; {{ date('Y') }} Inventory System. All rights reserved.</p>
            <p>Email ini dikirim otomatis, mohon tidak membalas email ini.</p>
            
            <div class="social-links">
                <a href="#">Privacy Policy</a> | 
                <a href="#">Terms of Service</a> | 
                <a href="#">Contact Us</a>
            </div>
        </div>
    </div>
</body>
</html>