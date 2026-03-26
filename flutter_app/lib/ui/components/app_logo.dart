import 'package:flutter/material.dart';

class AppLogo extends StatelessWidget {
  final double size;

  const AppLogo({super.key, this.size = 120});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        // Updated asset path
        image: DecorationImage(
          image: AssetImage('assets/images/FOODSCROLL.jpg'),
          fit: BoxFit.cover,
        ),
      ),
    );
  }
}
