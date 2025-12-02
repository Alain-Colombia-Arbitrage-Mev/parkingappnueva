import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/services/convex_service.dart';
import '../../core/models/job.dart';

class JobsScreen extends ConsumerWidget {
  const JobsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final convexService = ref.watch(convexServiceProvider);

    if (convexService == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Jobs')),
        body: const Center(
          child: Text('Servicio no disponible'),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Jobs'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              // Navigate to create job
            },
          ),
        ],
      ),
      body: StreamBuilder<List<dynamic>>(
        stream: convexService.getJobs(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }
          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text('No jobs found'));
          }

          final jobs = snapshot.data!
              .map((json) => Job.fromJson(Map<String, dynamic>.from(json)))
              .toList();

          return ListView.builder(
            itemCount: jobs.length,
            itemBuilder: (context, index) {
              final job = jobs[index];
              return ListTile(
                title: Text(job.title),
                subtitle: Text('${job.category} - ${job.status}'),
                trailing: Text(
                  '${job.budget['currency']} ${job.budget['min']} - ${job.budget['max']}',
                ),
                onTap: () {
                  // Navigate to job details
                },
              );
            },
          );
        },
      ),
    );
  }
}
