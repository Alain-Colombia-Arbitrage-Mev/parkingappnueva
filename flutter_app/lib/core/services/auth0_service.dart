import 'package:auth0_flutter/auth0_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Auth0 configuration
class Auth0Config {
  static const String domain = 'dev-j5u1piv8swty23ra.us.auth0.com';
  static const String clientId = 'qMiD0ce7jM3qd1JJJ68fZBeKJoNSOM3k';
  static const String scheme = 'com.parkiing.handyman';
}

/// Auth state enum
enum AuthStatus {
  initial,
  loading,
  authenticated,
  unauthenticated,
  error,
}

/// Auth state data class
class AuthStateData {
  final AuthStatus status;
  final UserProfile? user;
  final String? accessToken;
  final String? idToken;
  final String? error;

  const AuthStateData({
    this.status = AuthStatus.initial,
    this.user,
    this.accessToken,
    this.idToken,
    this.error,
  });

  AuthStateData copyWith({
    AuthStatus? status,
    UserProfile? user,
    String? accessToken,
    String? idToken,
    String? error,
  }) {
    return AuthStateData(
      status: status ?? this.status,
      user: user ?? this.user,
      accessToken: accessToken ?? this.accessToken,
      idToken: idToken ?? this.idToken,
      error: error,
    );
  }

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isLoading => status == AuthStatus.loading;
}

/// Auth0 state notifier
class Auth0StateNotifier extends Notifier<AuthStateData> {
  late Auth0 _auth0;
  late FlutterSecureStorage _storage;

  @override
  AuthStateData build() {
    _auth0 = ref.watch(auth0Provider);
    _storage = ref.watch(secureStorageProvider);
    return const AuthStateData();
  }

  /// Initialize and check for existing session
  Future<void> initialize() async {
    state = state.copyWith(status: AuthStatus.loading);

    try {
      final hasCredentials = await _auth0.credentialsManager.hasValidCredentials();

      if (hasCredentials) {
        final credentials = await _auth0.credentialsManager.credentials();
        state = AuthStateData(
          status: AuthStatus.authenticated,
          user: credentials.user,
          accessToken: credentials.accessToken,
          idToken: credentials.idToken,
        );
      } else {
        state = state.copyWith(status: AuthStatus.unauthenticated);
      }
    } catch (e) {
      state = AuthStateData(
        status: AuthStatus.unauthenticated,
        error: e.toString(),
      );
    }
  }

  /// Login with Auth0
  Future<bool> login() async {
    state = state.copyWith(status: AuthStatus.loading);

    try {
      final credentials = await _auth0.webAuthentication(scheme: Auth0Config.scheme).login(
        scopes: {'openid', 'profile', 'email', 'offline_access'},
      );

      state = AuthStateData(
        status: AuthStatus.authenticated,
        user: credentials.user,
        accessToken: credentials.accessToken,
        idToken: credentials.idToken,
      );

      return true;
    } catch (e) {
      state = AuthStateData(
        status: AuthStatus.unauthenticated,
        error: e.toString(),
      );
      return false;
    }
  }

  /// Signup with Auth0
  Future<bool> signup() async {
    state = state.copyWith(status: AuthStatus.loading);

    try {
      final credentials = await _auth0.webAuthentication(scheme: Auth0Config.scheme).login(
        scopes: {'openid', 'profile', 'email', 'offline_access'},
        parameters: {'screen_hint': 'signup'},
      );

      state = AuthStateData(
        status: AuthStatus.authenticated,
        user: credentials.user,
        accessToken: credentials.accessToken,
        idToken: credentials.idToken,
      );

      return true;
    } catch (e) {
      state = AuthStateData(
        status: AuthStatus.unauthenticated,
        error: e.toString(),
      );
      return false;
    }
  }

  /// Logout
  Future<void> logout() async {
    state = state.copyWith(status: AuthStatus.loading);

    try {
      await _auth0.webAuthentication(scheme: Auth0Config.scheme).logout();
      await _auth0.credentialsManager.clearCredentials();
      await _storage.deleteAll();
    } catch (_) {
      // Continue with logout even if Auth0 fails
    }

    state = const AuthStateData(status: AuthStatus.unauthenticated);
  }

  /// Get current ID token
  Future<String?> getIdToken() async {
    try {
      if (!state.isAuthenticated) return null;
      final credentials = await _auth0.credentialsManager.credentials();
      return credentials.idToken;
    } catch (_) {
      return null;
    }
  }
}

// Providers
final auth0Provider = Provider<Auth0>((ref) {
  return Auth0(Auth0Config.domain, Auth0Config.clientId);
});

final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );
});

final auth0StateProvider = NotifierProvider<Auth0StateNotifier, AuthStateData>(() {
  return Auth0StateNotifier();
});

// Convenience providers
final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(auth0StateProvider).isAuthenticated;
});

final currentUserProvider = Provider<UserProfile?>((ref) {
  return ref.watch(auth0StateProvider).user;
});

final authLoadingProvider = Provider<bool>((ref) {
  return ref.watch(auth0StateProvider).isLoading;
});
