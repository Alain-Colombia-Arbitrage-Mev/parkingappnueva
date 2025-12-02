import 'package:flutter/material.dart';

/// Breakpoints for different device sizes
class Breakpoints {
  // Width breakpoints
  static const double smallPhone = 320;    // iPhone SE, iPhone 5
  static const double phone = 375;          // iPhone 6/7/8, most Android phones
  static const double largePhone = 414;     // iPhone Plus, large Android phones
  static const double tablet = 600;         // Tablets, iPad mini
  static const double largeTablet = 900;    // iPad, large tablets
  static const double desktop = 1200;       // Desktop, foldables opened
  
  // Height breakpoints
  static const double shortPhone = 568;     // iPhone 5/SE
  static const double mediumPhone = 667;    // iPhone 6/7/8
  static const double tallPhone = 812;      // iPhone X and newer
}

/// Device type enum
enum DeviceType {
  smallPhone,   // iPhone 5/SE (320px)
  phone,        // Regular phones (375px)
  largePhone,   // Large phones (414px+)
  tablet,       // Tablets (600px+)
  largeTablet,  // Large tablets (900px+)
  desktop,      // Desktop/Foldables (1200px+)
}

/// Screen orientation helper
enum ScreenOrientation {
  portrait,
  landscape,
}

/// Responsive utility class
class Responsive {
  final BuildContext context;
  late final Size _size;
  late final double _width;
  late final double _height;
  late final double _aspectRatio;
  late final DeviceType _deviceType;
  late final ScreenOrientation _orientation;
  late final double _textScaleFactor;
  late final EdgeInsets _padding;
  late final bool _isFoldable;

  Responsive(this.context) {
    final mediaQuery = MediaQuery.of(context);
    _size = mediaQuery.size;
    _width = _size.width;
    _height = _size.height;
    _aspectRatio = _width / _height;
    _textScaleFactor = mediaQuery.textScaler.scale(1.0);
    _padding = mediaQuery.padding;
    _orientation = _width > _height ? ScreenOrientation.landscape : ScreenOrientation.portrait;
    _deviceType = _getDeviceType();
    _isFoldable = _detectFoldable();
  }

  // Getters
  Size get size => _size;
  double get width => _width;
  double get height => _height;
  double get aspectRatio => _aspectRatio;
  DeviceType get deviceType => _deviceType;
  ScreenOrientation get orientation => _orientation;
  double get textScaleFactor => _textScaleFactor;
  EdgeInsets get padding => _padding;
  bool get isFoldable => _isFoldable;

  // Device type checks
  bool get isSmallPhone => _deviceType == DeviceType.smallPhone;
  bool get isPhone => _deviceType == DeviceType.phone;
  bool get isLargePhone => _deviceType == DeviceType.largePhone;
  bool get isTablet => _deviceType == DeviceType.tablet;
  bool get isLargeTablet => _deviceType == DeviceType.largeTablet;
  bool get isDesktop => _deviceType == DeviceType.desktop;
  bool get isMobile => isSmallPhone || isPhone || isLargePhone;
  bool get isPortrait => _orientation == ScreenOrientation.portrait;
  bool get isLandscape => _orientation == ScreenOrientation.landscape;
  bool get isShortScreen => _height < Breakpoints.shortPhone;

  DeviceType _getDeviceType() {
    if (_width >= Breakpoints.desktop) return DeviceType.desktop;
    if (_width >= Breakpoints.largeTablet) return DeviceType.largeTablet;
    if (_width >= Breakpoints.tablet) return DeviceType.tablet;
    if (_width >= Breakpoints.largePhone) return DeviceType.largePhone;
    if (_width >= Breakpoints.phone) return DeviceType.phone;
    return DeviceType.smallPhone;
  }

  bool _detectFoldable() {
    // Foldables typically have unusual aspect ratios when unfolded
    // or very wide screens in landscape
    return (_width > 600 && _aspectRatio > 1.8) || 
           (_width > 800 && _aspectRatio < 0.6);
  }

  /// Get responsive value based on device type
  T value<T>({
    required T mobile,
    T? smallPhone,
    T? largePhone,
    T? tablet,
    T? largeTablet,
    T? desktop,
    T? foldable,
  }) {
    if (_isFoldable && foldable != null) return foldable;
    
    switch (_deviceType) {
      case DeviceType.smallPhone:
        return smallPhone ?? mobile;
      case DeviceType.phone:
        return mobile;
      case DeviceType.largePhone:
        return largePhone ?? mobile;
      case DeviceType.tablet:
        return tablet ?? largePhone ?? mobile;
      case DeviceType.largeTablet:
        return largeTablet ?? tablet ?? mobile;
      case DeviceType.desktop:
        return desktop ?? largeTablet ?? tablet ?? mobile;
    }
  }

  /// Responsive font size
  double fontSize({
    required double mobile,
    double? smallPhone,
    double? tablet,
    double? desktop,
  }) {
    double baseSize = value<double>(
      mobile: mobile,
      smallPhone: smallPhone ?? mobile * 0.85,
      tablet: tablet ?? mobile * 1.1,
      desktop: desktop ?? mobile * 1.2,
    );
    
    // Adjust for short screens (iPhone 5)
    if (isShortScreen) {
      baseSize *= 0.9;
    }
    
    return baseSize;
  }

  /// Responsive spacing
  double spacing({
    required double mobile,
    double? smallPhone,
    double? tablet,
    double? desktop,
  }) {
    double baseSpacing = value<double>(
      mobile: mobile,
      smallPhone: smallPhone ?? mobile * 0.75,
      tablet: tablet ?? mobile * 1.25,
      desktop: desktop ?? mobile * 1.5,
    );
    
    // Reduce spacing on short screens
    if (isShortScreen) {
      baseSpacing *= 0.8;
    }
    
    return baseSpacing;
  }

  /// Responsive icon size
  double iconSize({
    required double mobile,
    double? smallPhone,
    double? tablet,
  }) {
    return value<double>(
      mobile: mobile,
      smallPhone: smallPhone ?? mobile * 0.85,
      tablet: tablet ?? mobile * 1.2,
    );
  }

  /// Responsive padding
  EdgeInsets responsivePadding({
    required double horizontal,
    required double vertical,
  }) {
    return EdgeInsets.symmetric(
      horizontal: spacing(mobile: horizontal),
      vertical: spacing(mobile: vertical),
    );
  }

  /// Get responsive width percentage
  double wp(double percentage) => _width * percentage / 100;

  /// Get responsive height percentage
  double hp(double percentage) => _height * percentage / 100;

  /// Responsive card width for job cards
  double get jobCardWidth {
    return value<double>(
      mobile: 260,
      smallPhone: 220,
      largePhone: 280,
      tablet: 320,
      foldable: 300,
    );
  }

  /// Responsive map height
  double get mapHeight {
    if (isShortScreen) {
      return hp(55);
    }
    return value<double>(
      mobile: hp(65),
      smallPhone: hp(55),
      tablet: hp(70),
    );
  }

  /// Max content width for larger screens
  double get maxContentWidth {
    return value<double>(
      mobile: _width,
      tablet: 600,
      largeTablet: 800,
      desktop: 1000,
      foldable: _width * 0.7,
    );
  }
}

/// Extension for easy access
extension ResponsiveContext on BuildContext {
  Responsive get responsive => Responsive(this);
}

/// Responsive builder widget
class ResponsiveBuilder extends StatelessWidget {
  final Widget Function(BuildContext context, Responsive responsive) builder;

  const ResponsiveBuilder({
    super.key,
    required this.builder,
  });

  @override
  Widget build(BuildContext context) {
    return builder(context, Responsive(context));
  }
}

/// Responsive layout widget for different screen sizes
class ResponsiveLayout extends StatelessWidget {
  final Widget mobile;
  final Widget? smallPhone;
  final Widget? tablet;
  final Widget? desktop;
  final Widget? foldable;

  const ResponsiveLayout({
    super.key,
    required this.mobile,
    this.smallPhone,
    this.tablet,
    this.desktop,
    this.foldable,
  });

  @override
  Widget build(BuildContext context) {
    final responsive = Responsive(context);
    
    if (responsive.isFoldable && foldable != null) return foldable!;
    
    return responsive.value<Widget>(
      mobile: mobile,
      smallPhone: smallPhone,
      tablet: tablet,
      desktop: desktop,
    );
  }
}



