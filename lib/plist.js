const gen_plist = (opt = { url: "",packageName:"" ,version: "", appName: "" }) => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>items</key>
	<array>
		<dict>
			<key>assets</key>
			<array>
				<dict>
					<key>kind</key>
					<string>software-package</string>
					<key>url</key>
					<string>${opt.url}</string>
				</dict>
				<dict>
					<key>kind</key>
					<string>full-size-image</string>
					<key>needs-shine</key>
					<true/>
					<key>url</key>
					<string>https://www.baidu.com/icons/Icon@2x.png</string>
				</dict>
				<dict>
					<key>kind</key>
					<string>display-image</string>
					<key>needs-shine</key>
					<true/>
					<key>url</key>
					<string>https://www.baidu.com/icons/Icon.png</string>
				</dict>
			</array>
			<key>metadata</key>
			<dict>
				<key>bundle-identifier</key>
				<string>${opt.packageName}</string>
				<key>bundle-version</key>
				<string>${opt.version}</string>
                <key>kind</key>
				<string>software</string>
                <key>title</key>
				<string>${opt.appName}</string>
			</dict>
		</dict>
	</array>
</dict>
</plist>`

// console.log(gen_plist({url:'http://xxx.ipa',packageName:'com.xxx.test',version:'1.1.0',name:'test'}));

module.exports = { gen_plist }

