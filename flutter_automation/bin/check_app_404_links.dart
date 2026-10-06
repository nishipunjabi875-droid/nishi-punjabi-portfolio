import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:html/parser.dart' show parse;

/// Link Audit Result Data Structure
class LinkCheckResult {
  final String url;
  final String sourceScreenOrContext;
  final int statusCode;
  final String? errorMessage;
  final Duration responseTime;

  LinkCheckResult({
    required this.url,
    required this.sourceScreenOrContext,
    required this.statusCode,
    this.errorMessage,
    required this.responseTime,
  });

  bool get is404 => statusCode == 404;
  bool get isSuccess => statusCode >= 200 && statusCode < 400;

  Map<String, dynamic> toJson() => {
        'url': url,
        'context': sourceScreenOrContext,
        'statusCode': statusCode,
        'errorMessage': errorMessage,
        'responseTimeMs': responseTime.inMilliseconds,
      };
}

/// Flutter App 404 Link Audit Engine
class FlutterAppLinkChecker {
  final http.Client _client = http.Client();
  final Set<String> _visitedUrls = {};
  final List<LinkCheckResult> _results = [];

  final String userAgent =
      'Mozilla/5.0 (Flutter App LinkChecker Automated Audit Tool 1.0)';

  /// Audit a list of deep-links, webview URLs, or app screen targets
  Future<List<LinkCheckResult>> auditLinks({
    required List<String> targetUrls,
    String defaultContext = 'App Navigation / DeepLink',
    int concurrency = 10,
    Duration timeout = const Duration(seconds: 10),
  }) async {
    print('🚀 Starting Flutter App 404 Link Audit...');
    print('Target URLs to check: ${targetUrls.length}');

    final queue = List<String>.from(targetUrls);
    final pool = <Future>[];

    for (var i = 0; i < concurrency && queue.isNotEmpty; i++) {
      pool.add(_worker(queue, defaultContext, timeout));
    }

    await Future.wait(pool);
    print('✅ Audit completed. Total URLs tested: ${_results.length}');
    return _results;
  }

  Future<void> _worker(
    List<String> queue,
    String contextName,
    Duration timeout,
  ) async {
    while (queue.isNotEmpty) {
      final url = queue.removeAt(0);
      if (_visitedUrls.contains(url)) continue;
      _visitedUrls.add(url);

      await _checkSingleLink(url, contextName, timeout);
    }
  }

  Future<LinkCheckResult> _checkSingleLink(
    String urlString,
    String contextName,
    Duration timeout,
  ) async {
    final stopwatch = Stopwatch()..start();
    try {
      final uri = Uri.parse(urlString);
      if (!uri.hasScheme || (!uri.isScheme('http') && !uri.isScheme('https'))) {
        final res = LinkCheckResult(
          url: urlString,
          sourceScreenOrContext: contextName,
          statusCode: 0,
          errorMessage: 'Invalid URI scheme (must be http/https)',
          responseTime: Duration.zero,
        );
        _results.add(res);
        return res;
      }

      final response = await _client.get(
        uri,
        headers: {'User-Agent': userAgent},
      ).timeout(timeout);

      stopwatch.stop();

      final res = LinkCheckResult(
        url: urlString,
        sourceScreenOrContext: contextName,
        statusCode: response.statusCode,
        responseTime: stopwatch.elapsed,
      );

      _results.add(res);

      if (res.is404) {
        print('❌ [404 NOT FOUND] $urlString (Screen/Context: $contextName)');
      } else if (!res.isSuccess) {
        print('⚠️ [${response.statusCode}] $urlString');
      } else {
        print('✅ [${response.statusCode} OK] $urlString');
      }

      return res;
    } catch (e) {
      stopwatch.stop();
      final res = LinkCheckResult(
        url: urlString,
        sourceScreenOrContext: contextName,
        statusCode: 0,
        errorMessage: e.toString(),
        responseTime: stopwatch.elapsed,
      );
      _results.add(res);
      print('⚠️ [ERROR] $urlString : ${e.toString()}');
      return res;
    }
  }

  /// Crawl embedded links from an in-app webview URL or app landing page
  Future<void> crawlAndAuditWebviewPage(
    String webviewUrl, {
    int maxDepth = 1,
  }) async {
    print('\n🌐 Extracting links from WebView target: $webviewUrl');
    try {
      final uri = Uri.parse(webviewUrl);
      final response = await _client.get(uri, headers: {'User-Agent': userAgent});
      
      if (response.statusCode == 200) {
        final document = parse(response.body);
        final anchors = document.querySelectorAll('a[href]');
        final linksToAudit = <String>[];

        for (var a in anchors) {
          final href = a.attributes['href'];
          if (href != null && href.isNotEmpty) {
            final absoluteUri = uri.resolve(href);
            if (absoluteUri.scheme == 'http' || absoluteUri.scheme == 'https') {
              linksToAudit.add(absoluteUri.toString());
            }
          }
        }

        print('Found ${linksToAudit.length} embedded links inside WebView.');
        await auditLinks(
          targetUrls: linksToAudit,
          defaultContext: 'WebView ($webviewUrl)',
        );
      } else {
        print('❌ Target WebView page returned status code: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Failed to crawl WebView page: $e');
    }
  }

  void close() {
    _client.close();
  }
}

void main(List<String> args) async {
  final checker = FlutterAppLinkChecker();

  // Target app links or deep links to audit
  final sampleAppLinks = [
    'https://www.woodenstreet.com/media',
    'https://www.woodenstreet.com/platters',
    'https://www.woodenstreet.com/wall-masks',
    'https://www.woodenstreet.com/wall-plates',
    'https://www.woodenstreet.com/bathroom-mirrors',
    'https://www.woodenstreet.com/sofa-sets',
    'https://www.woodenstreet.com/beds',
  ];

  print('==================================================');
  print(' FLUTTER AUTOMATION: 404 LINK AUDIT RUNNER');
  print('==================================================\n');

  final results = await checker.auditLinks(targetUrls: sampleAppLinks);

  final broken404s = results.where((r) => r.is404).toList();
  final otherFailures = results.where((r) => !r.isSuccess && !r.is404).toList();
  final successes = results.where((r) => r.isSuccess).toList();

  print('\n==================================================');
  print(' FLUTTER AUDIT SUMMARY REPORT');
  print('==================================================');
  print('Total URLs Audited: ${results.length}');
  print('Passed (200 OK): ${successes.length}');
  print('Failed (404 Not Found): ${broken404s.length}');
  print('Other Errors / Statuses: ${otherFailures.length}');
  print('==================================================\n');

  if (broken404s.isNotEmpty) {
    print('--- DETAILED LIST OF 404 BROKEN LINKS ---');
    for (var i = 0; i < broken404s.length; i++) {
      final b = broken404s[i];
      print('${i + 1}. [404] ${b.url}');
      print('   Context: ${b.sourceScreenOrContext}');
      print('   Latency: ${b.responseTime.inMilliseconds}ms\n');
    }
  } else {
    print('🎉 No 404 links found in the app!');
  }

  // Export JSON Report
  final jsonReport = {
    'auditDate': DateTime.now().toIso8601String(),
    'totalScanned': results.length,
    'total404': broken404s.length,
    'results': results.map((r) => r.toJson()).toList(),
  };

  final file = File('flutter_404_audit_report.json');
  await file.writeAsString(jsonEncode(jsonReport));
  print('📄 Report saved to flutter_404_audit_report.json');

  checker.close();
}
