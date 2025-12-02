import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/utils/responsive.dart';

/// Model for a job posting
class JobPosting {
  final String userName;
  final String userAvatar;
  final String timeAgo;
  final String description;
  final String price;
  final String currency;
  final bool isUrgent;

  const JobPosting({
    required this.userName,
    required this.userAvatar,
    required this.timeAgo,
    required this.description,
    required this.price,
    this.currency = 'Pesos',
    this.isUrgent = false,
  });
}

/// Sample job postings for animation
final List<JobPosting> sampleJobs = [
  const JobPosting(
    userName: 'María González',
    userAvatar: 'https://i.pravatar.cc/150?img=1',
    timeAgo: 'Hace 5 min',
    description: 'Necesito un plomero para arreglar una ducha que gotea',
    price: '100,000',
  ),
  const JobPosting(
    userName: 'Carlos Rodríguez',
    userAvatar: 'https://i.pravatar.cc/150?img=3',
    timeAgo: 'Hace 12 min',
    description: 'Electricista para instalar lámparas en el jardín',
    price: '150,000',
    isUrgent: true,
  ),
  const JobPosting(
    userName: 'Ana Martínez',
    userAvatar: 'https://i.pravatar.cc/150?img=5',
    timeAgo: 'Hace 20 min',
    description: 'Pintor para renovar sala y comedor',
    price: '280,000',
  ),
  const JobPosting(
    userName: 'Pedro López',
    userAvatar: 'https://i.pravatar.cc/150?img=8',
    timeAgo: 'Hace 35 min',
    description: 'Carpintero para reparar puerta principal',
    price: '85,000',
    isUrgent: true,
  ),
  const JobPosting(
    userName: 'Laura Sánchez',
    userAvatar: 'https://i.pravatar.cc/150?img=9',
    timeAgo: 'Hace 1 hora',
    description: 'Limpieza profunda de apartamento 3 habitaciones',
    price: '120,000',
  ),
];

/// Animated job card component
class JobCard extends StatefulWidget {
  final VoidCallback? onOfertar;
  final Duration animationInterval;

  const JobCard({
    super.key,
    this.onOfertar,
    this.animationInterval = const Duration(seconds: 4),
  });

  @override
  State<JobCard> createState() => _JobCardState();
}

class _JobCardState extends State<JobCard> {
  int _currentJobIndex = 0;
  bool _isAnimating = false;

  @override
  void initState() {
    super.initState();
    _startJobRotation();
  }

  void _startJobRotation() {
    Future.delayed(widget.animationInterval, () {
      if (mounted) {
        setState(() => _isAnimating = true);
        
        Future.delayed(const Duration(milliseconds: 300), () {
          if (mounted) {
            setState(() {
              _currentJobIndex = (_currentJobIndex + 1) % sampleJobs.length;
              _isAnimating = false;
            });
            _startJobRotation();
          }
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final job = sampleJobs[_currentJobIndex];
    final r = context.responsive;
    const primaryOrange = Color(0xFFFF6B36);
    
    return AnimatedOpacity(
      duration: const Duration(milliseconds: 250),
      opacity: _isAnimating ? 0.0 : 1.0,
      child: AnimatedScale(
        duration: const Duration(milliseconds: 250),
        scale: _isAnimating ? 0.95 : 1.0,
        child: Container(
          padding: EdgeInsets.all(r.spacing(mobile: 12, smallPhone: 10)),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: const Color(0xFF0F1441),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(25),
                blurRadius: 15,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header row
              Row(
                children: [
                  // Avatar
                  Container(
                    width: r.iconSize(mobile: 42, smallPhone: 36),
                    height: r.iconSize(mobile: 42, smallPhone: 36),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: primaryOrange.withAlpha(76),
                        width: 2,
                      ),
                    ),
                    child: ClipOval(
                      child: Image.network(
                        job.userAvatar,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            color: Colors.grey[200],
                            child: Icon(
                              Icons.person,
                              color: Colors.grey[400],
                              size: r.iconSize(mobile: 24, smallPhone: 20),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                  SizedBox(width: r.spacing(mobile: 8, smallPhone: 6)),
                  
                  // Name and time
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          job.userName,
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontWeight: FontWeight.bold,
                            fontSize: r.fontSize(mobile: 12, smallPhone: 10),
                            color: Colors.black,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        SizedBox(height: r.spacing(mobile: 2, smallPhone: 1)),
                        Row(
                          children: [
                            Text(
                              job.timeAgo,
                              style: TextStyle(
                                fontFamily: 'Inter',
                                fontSize: r.fontSize(mobile: 10, smallPhone: 8),
                                color: Colors.grey[500],
                              ),
                            ),
                            if (job.isUrgent) ...[
                              SizedBox(width: r.spacing(mobile: 4, smallPhone: 3)),
                              Container(
                                padding: EdgeInsets.symmetric(
                                  horizontal: r.spacing(mobile: 5, smallPhone: 4),
                                  vertical: r.spacing(mobile: 2, smallPhone: 1),
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.red.withAlpha(25),
                                  borderRadius: BorderRadius.circular(3),
                                ),
                                child: Text(
                                  '⚡',
                                  style: TextStyle(
                                    fontSize: r.fontSize(mobile: 8, smallPhone: 7),
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                  
                  // P Logo
                  _buildParkiingLogo(r),
                ],
              ),
              
              SizedBox(height: r.spacing(mobile: 10, smallPhone: 8)),
              
              // Description
              Text(
                job.description,
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontWeight: FontWeight.w600,
                  fontSize: r.fontSize(mobile: 11, smallPhone: 9),
                  color: Colors.black87,
                  height: 1.3,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              
              SizedBox(height: r.spacing(mobile: 12, smallPhone: 10)),
              
              // Price and Ofertar button
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${job.price} ${job.currency}',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontWeight: FontWeight.bold,
                      fontSize: r.fontSize(mobile: 12, smallPhone: 10),
                      color: primaryOrange,
                    ),
                  ),
                  GestureDetector(
                    onTap: widget.onOfertar,
                    child: Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: r.spacing(mobile: 16, smallPhone: 12),
                        vertical: r.spacing(mobile: 8, smallPhone: 6),
                      ),
                      decoration: BoxDecoration(
                        color: primaryOrange,
                        borderRadius: BorderRadius.circular(5),
                        boxShadow: [
                          BoxShadow(
                            color: primaryOrange.withAlpha(76),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Text(
                        'Ofertar',
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontWeight: FontWeight.bold,
                          fontSize: r.fontSize(mobile: 11, smallPhone: 9),
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    ).animate()
      .fadeIn(duration: 500.ms)
      .slideX(begin: -0.1, end: 0);
  }

  Widget _buildParkiingLogo(Responsive r) {
    final size = r.iconSize(mobile: 36, smallPhone: 30);
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFFF8A5C), Color(0xFFFF6B36)],
        ),
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFFF6B36).withAlpha(76),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Center(
        child: Text(
          'P',
          style: TextStyle(
            fontFamily: 'Inter',
            fontWeight: FontWeight.bold,
            fontSize: r.fontSize(mobile: 18, smallPhone: 14),
            color: Colors.white,
          ),
        ),
      ),
    );
  }
}

/// Static job card for displaying a specific job
class StaticJobCard extends StatelessWidget {
  final JobPosting job;
  final VoidCallback? onOfertar;

  const StaticJobCard({
    super.key,
    required this.job,
    this.onOfertar,
  });

  @override
  Widget build(BuildContext context) {
    final r = context.responsive;
    const primaryOrange = Color(0xFFFF6B36);
    
    return Container(
      padding: EdgeInsets.all(r.spacing(mobile: 12, smallPhone: 10)),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: const Color(0xFF0F1441),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(25),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: r.iconSize(mobile: 42, smallPhone: 36),
                height: r.iconSize(mobile: 42, smallPhone: 36),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: primaryOrange.withAlpha(76),
                    width: 2,
                  ),
                ),
                child: ClipOval(
                  child: Image.network(
                    job.userAvatar,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        color: Colors.grey[200],
                        child: Icon(Icons.person, color: Colors.grey[400]),
                      );
                    },
                  ),
                ),
              ),
              SizedBox(width: r.spacing(mobile: 8, smallPhone: 6)),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      job.userName,
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.bold,
                        fontSize: r.fontSize(mobile: 12, smallPhone: 10),
                        color: Colors.black,
                      ),
                    ),
                    Text(
                      job.timeAgo,
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: r.fontSize(mobile: 10, smallPhone: 8),
                        color: Colors.grey[500],
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                width: r.iconSize(mobile: 36, smallPhone: 30),
                height: r.iconSize(mobile: 36, smallPhone: 30),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFF8A5C), Color(0xFFFF6B36)],
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Text(
                    'P',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: r.fontSize(mobile: 18, smallPhone: 14),
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: r.spacing(mobile: 10, smallPhone: 8)),
          Text(
            job.description,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: r.fontSize(mobile: 11, smallPhone: 9),
              color: Colors.black87,
              height: 1.3,
            ),
            maxLines: 2,
          ),
          SizedBox(height: r.spacing(mobile: 12, smallPhone: 10)),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${job.price} ${job.currency}',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: r.fontSize(mobile: 12, smallPhone: 10),
                  color: primaryOrange,
                ),
              ),
              GestureDetector(
                onTap: onOfertar,
                child: Container(
                  padding: EdgeInsets.symmetric(
                    horizontal: r.spacing(mobile: 16, smallPhone: 12),
                    vertical: r.spacing(mobile: 8, smallPhone: 6),
                  ),
                  decoration: BoxDecoration(
                    color: primaryOrange,
                    borderRadius: BorderRadius.circular(5),
                  ),
                  child: Text(
                    'Ofertar',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: r.fontSize(mobile: 11, smallPhone: 9),
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
