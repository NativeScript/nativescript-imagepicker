module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      dist: ["dist"]
    },
    exec: {
      tsc_package: 'node_modules/typescript/bin/tsc -p ./source/',
      npm_pack: {
        cmd: 'npm pack ./package',
        cwd: 'dist/'
      },
      tns_install: {
        cmd: 'tns install',
        cwd: 'examples/ExampleImgPick'
      },
      tns_plugin_install: {
        cmd: 'tns plugin add ../../dist/package',
        cwd: 'examples/ExampleImgPick'
      },
      run_ios_emulator: {
        cmd: 'tns run ios --emulator --device iPhone-6',
        cwd: 'examples/ExampleImgPick'
      }
    },
    copy: {
      package: {
        files: [
          { expand: true, cwd: 'source', src: ['**/*.js', '**/*.xml', 'package.json', 'README.md', 'imagepicker.d.ts'], dest: 'dist/package' }
        ]
      }
    },
    mkdir: {
      dist: {
        options: {
          create: ["dist/package"]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-mkdir');

  // Default task(s).
  grunt.registerTask('default', [
    'clean:dist',
    'exec:tsc_package',
    'mkdir:dist',
    'copy:package',
    'exec:npm_pack',
    'exec:tns_install',
    'exec:tns_plugin_install'
  ]);

  grunt.registerTask('ios', [
    'default',
    'exec:run_ios_emulator'
  ]);
};

