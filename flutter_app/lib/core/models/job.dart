class Job {
  final String id;
  final String title;
  final String description;
  final String category;
  final Map<String, dynamic> budget;
  final String status;
  final Map<String, dynamic> location;
  final int createdAt;

  Job({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.budget,
    required this.status,
    required this.location,
    required this.createdAt,
  });

  factory Job.fromJson(Map<String, dynamic> json) {
    return Job(
      id: json['_id'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      category: json['category'] as String,
      budget: Map<String, dynamic>.from(json['budget'] as Map),
      status: json['status'] as String,
      location: Map<String, dynamic>.from(json['location'] as Map),
      createdAt: (json['createdAt'] as num).toInt(),
    );
  }
}
