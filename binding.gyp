{
	# 'target_defaults': {
	# 	'default_configuration': 'Release',
	# 	'configurations': {
	# 		'Release': {
	# 			'cflags': [ '-Wno-deprecated-declarations' ],
	# 			'xcode_settings': {
	# 				'GCC_OPTIMIZATION_LEVEL': '3',
	# 				'OTHER_CFLAGS': [ '-Wno-deprecated-declarations' ],
	# 			},
	# 		},
	# 		'Debug': {
	# 			'defines': [ 'V8_IMMINENT_DEPRECATION_WARNINGS' ],
	# 		},
	# 	},
	# },
	'targets': [
		{
			'target_name': 'bindings',
			'cflags_cc': [ '-std=c++14', '-g', '-Wno-unknown-pragmas' ],
			'include_dirs': [
				'<!(node -e "require(\'nan\')")',
			],
			'conditions': [
				[ 'OS == "win"',
					{ 'defines': [ 'IVM_DLLEXPORT=__declspec(dllexport)' ] },
					{ 'defines': [ 'IVM_DLLEXPORT=' ] },
				],
			],
			'sources': [
				'native/text-encoding.cc',
				'native/crypto.cc',
				'native/main.cc'
			],
		},
	],
}