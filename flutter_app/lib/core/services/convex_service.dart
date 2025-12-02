import 'dart:async';
import 'dart:convert';
import 'package:convex_flutter/convex_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'auth0_service.dart';

final convexClientProvider = Provider<ConvexClient?>((ref) => null);

final convexServiceProvider = Provider<ConvexService?>((ref) {
  final client = ref.watch(convexClientProvider);
  if (client == null) return null;
  final auth0State = ref.watch(auth0StateProvider.notifier);
  return ConvexService(client, auth0State);
});

class ConvexService {
  final ConvexClient _client;
  final Auth0StateNotifier _auth0State;

  ConvexService(this._client, this._auth0State);

  ConvexClient get client => _client;

  /// Set the authentication token for Convex requests
  Future<void> _setAuthToken() async {
    final idToken = await _auth0State.getIdToken();
    await _client.setAuth(token: idToken);
  }

  /// Parse JSON result from Convex
  dynamic _parseResult(String result) {
    try {
      return jsonDecode(result);
    } catch (e) {
      return result;
    }
  }

  // ============ Auth & User Status Methods ============

  /// Check if user exists and needs onboarding
  Future<Map<String, dynamic>> checkUserStatus() async {
    await _setAuthToken();
    final result = await _client.query('authUsers:checkUserStatus', {});
    return _parseResult(result) as Map<String, dynamic>;
  }

  /// Get current authenticated user
  Future<Map<String, dynamic>?> getCurrentUser() async {
    await _setAuthToken();
    final result = await _client.query('authUsers:getCurrentUser', {});
    final parsed = _parseResult(result);
    return parsed == null ? null : parsed as Map<String, dynamic>;
  }

  /// Check if user is authenticated
  Future<Map<String, dynamic>> isAuthenticated() async {
    await _setAuthToken();
    final result = await _client.query('authUsers:isAuthenticated', {});
    return _parseResult(result) as Map<String, dynamic>;
  }

  // ============ User Creation & Onboarding Methods ============

  /// Create a new user with role (after Auth0 authentication)
  Future<Map<String, dynamic>> createUserWithRole({
    required String role,
    String? phone,
    List<String>? categories,
    List<String>? skills,
    double? hourlyRate,
    String? bio,
    Map<String, dynamic>? location,
  }) async {
    await _setAuthToken();
    final args = <String, dynamic>{'role': role};
    if (phone != null) args['phone'] = phone;
    if (categories != null) args['categories'] = categories;
    if (skills != null) args['skills'] = skills;
    if (hourlyRate != null) args['hourlyRate'] = hourlyRate;
    if (bio != null) args['bio'] = bio;
    if (location != null) args['location'] = location;

    final result = await _client.mutation(
      name: 'authUsers:createUserWithRole',
      args: args,
    );
    return _parseResult(result) as Map<String, dynamic>;
  }

  /// Store or update user (legacy method for backward compatibility)
  Future<Map<String, dynamic>> storeUser({String? role}) async {
    await _setAuthToken();
    final result = await _client.mutation(
      name: 'authUsers:storeUser',
      args: role != null ? {'role': role} : {},
    );
    return _parseResult(result) as Map<String, dynamic>;
  }

  /// Update user role
  Future<Map<String, dynamic>> updateUserRole(String role) async {
    await _setAuthToken();
    final result = await _client.mutation(
      name: 'authUsers:updateUserRole',
      args: {'role': role},
    );
    return _parseResult(result) as Map<String, dynamic>;
  }

  // ============ Profile Methods ============

  /// Get user profile
  Future<Map<String, dynamic>?> getMyProfile() async {
    await _setAuthToken();
    final result = await _client.query('authUsers:getMyProfile', {});
    final parsed = _parseResult(result);
    return parsed == null ? null : parsed as Map<String, dynamic>;
  }

  /// Update general profile information
  Future<Map<String, dynamic>> updateProfile({
    String? name,
    String? phone,
    String? bio,
    Map<String, dynamic>? location,
  }) async {
    await _setAuthToken();
    final args = <String, dynamic>{};
    if (name != null) args['name'] = name;
    if (phone != null) args['phone'] = phone;
    if (bio != null) args['bio'] = bio;
    if (location != null) args['location'] = location;

    final result = await _client.mutation(
      name: 'authUsers:updateProfile',
      args: args,
    );
    return _parseResult(result) as Map<String, dynamic>;
  }

  /// Update handyman professional profile
  Future<Map<String, dynamic>> updateHandymanProfile({
    List<String>? categories,
    List<String>? skills,
    double? hourlyRate,
    String? currency,
    String? bio,
    String? availability,
  }) async {
    await _setAuthToken();
    final args = <String, dynamic>{};
    if (categories != null) args['categories'] = categories;
    if (skills != null) args['skills'] = skills;
    if (hourlyRate != null) args['hourlyRate'] = hourlyRate;
    if (currency != null) args['currency'] = currency;
    if (bio != null) args['bio'] = bio;
    if (availability != null) args['availability'] = availability;

    final result = await _client.mutation(
      name: 'authUsers:updateHandymanProfile',
      args: args,
    );
    return _parseResult(result) as Map<String, dynamic>;
  }

  /// Delete user account
  Future<Map<String, dynamic>> deleteMyAccount() async {
    await _setAuthToken();
    final result = await _client.mutation(
      name: 'authUsers:deleteMyAccount',
      args: {},
    );
    return _parseResult(result) as Map<String, dynamic>;
  }

  /// Get available categories
  Future<List<dynamic>> getCategories() async {
    final result = await _client.query('authUsers:getCategories', {});
    return _parseResult(result) as List<dynamic>;
  }

  // ============ Legacy Auth Methods (kept for backward compatibility) ============

  Future<Map<String, dynamic>> login(String email, String password) async {
    final result = await _client.mutation(
      name: 'auth:login',
      args: {
        'email': email,
        'password': password,
      },
    );
    return _parseResult(result) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> register({
    required String email,
    required String name,
    required String password,
    required String role,
  }) async {
    final result = await _client.mutation(
      name: 'auth:register',
      args: {
        'email': email,
        'name': name,
        'password': password,
        'role': role,
      },
    );
    return _parseResult(result) as Map<String, dynamic>;
  }

  // ============ Jobs Methods ============

  Stream<List<dynamic>> getJobs() {
    final controller = StreamController<List<dynamic>>();
    _setAuthToken().then((_) {
      _client.subscribe(
        name: 'jobs:getJobs',
        args: {},
        onUpdate: (value) {
          controller.add(_parseResult(value) as List<dynamic>);
        },
        onError: (error, value) {
          controller.addError(error);
        },
      ).then((sub) {
        controller.onCancel = () => _client.cancelSubscription(sub);
      });
    });
    return controller.stream;
  }

  Future<List<dynamic>> getOpenJobs({String? category, int? limit}) async {
    await _setAuthToken();
    final args = <String, String>{};
    if (category != null) args['category'] = category;
    if (limit != null) args['limit'] = limit.toString();

    final result = await _client.query('jobs:getOpenJobs', args);
    return _parseResult(result) as List<dynamic>;
  }

  Future<Map<String, dynamic>> createJob({
    required String title,
    required String description,
    required String category,
    required Map<String, dynamic> budget,
    required Map<String, dynamic> location,
    bool isUrgent = false,
    int? deadline,
  }) async {
    await _setAuthToken();
    final args = <String, dynamic>{
      'title': title,
      'description': description,
      'category': category,
      'budget': budget,
      'location': location,
      'isUrgent': isUrgent,
    };
    if (deadline != null) args['deadline'] = deadline;

    final result = await _client.mutation(
      name: 'jobs:createJob',
      args: args,
    );
    return _parseResult(result) as Map<String, dynamic>;
  }

  // ============ Proposals Methods ============

  Future<Map<String, dynamic>> submitProposal({
    required String jobId,
    required double proposedPrice,
    String? estimatedDuration,
    String? message,
  }) async {
    await _setAuthToken();
    final args = <String, dynamic>{
      'jobId': jobId,
      'proposedPrice': proposedPrice,
    };
    if (estimatedDuration != null) args['estimatedDuration'] = estimatedDuration;
    if (message != null) args['message'] = message;

    final result = await _client.mutation(
      name: 'jobs:submitProposal',
      args: args,
    );
    return _parseResult(result) as Map<String, dynamic>;
  }

  Future<List<dynamic>> getProposalsForJob(String jobId) async {
    await _setAuthToken();
    final result = await _client.query('jobs:getProposalsForJob', {'jobId': jobId});
    return _parseResult(result) as List<dynamic>;
  }

  Future<List<dynamic>> getMyProposals() async {
    await _setAuthToken();
    final result = await _client.query('jobs:getMyProposals', {});
    return _parseResult(result) as List<dynamic>;
  }

  // ============ Handyman Discovery Methods ============

  Future<List<dynamic>> getVerifiedHandymen({
    String? category,
    int? limit,
  }) async {
    await _setAuthToken();
    final args = <String, String>{};
    if (category != null) args['category'] = category;
    if (limit != null) args['limit'] = limit.toString();

    final result = await _client.query('auth:getVerifiedHandymen', args);
    return _parseResult(result) as List<dynamic>;
  }
}
