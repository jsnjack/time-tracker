TT_PO = `find ./time_tracker_jsnjack@gmail.com/locale -name *.po`
DOMAIN = time-tracker

.DEFAULT_GOAL := all

.PHONY: update_po
update_po: time_tracker_jsnjack@gmail.com/time-tracker.pot
	for item in $(TT_PO); do \
		echo "Processing" $$item; \
		xgettext --from-code=UTF-8 --output=$$item.tmp ./time_tracker_jsnjack@gmail.com/*.js; \
		msgmerge -U $$item $$item.tmp; \
		rm -f $$item.tmp; \
		msgfmt -c $$item -o `dirname $$item`/${DOMAIN}.mo; \
	done;

time_tracker_jsnjack@gmail.com/time-tracker.pot: time_tracker_jsnjack@gmail.com/*.js
	xgettext --from-code=UTF-8 --output=$@.tmp ./time_tracker_jsnjack@gmail.com/*.js
	msgmerge -U $@ $@.tmp
	rm -f $@.tmp

time_tracker_jsnjack@gmail.com/schemas/gschemas.compiled: time_tracker_jsnjack@gmail.com/schemas/org.gnome.shell.extensions.time-tracker.gschema.xml
	glib-compile-schemas time_tracker_jsnjack@gmail.com/schemas/

time_tracker_jsnjack@gmail.com.shell-extension.zip: ./time_tracker_jsnjack@gmail.com/*.* time_tracker_jsnjack@gmail.com/schemas/gschemas.compiled
	rm -rf build/
	cp -R time_tracker_jsnjack@gmail.com build
	find ./build -type f -name *.po -delete
	find ./build -type f -name *.po~ -delete
	find ./build -type f -name "*.pot" -delete
	find ./build -type f -name "*.pot~" -delete
	cd build && zip -qr time_tracker_jsnjack@gmail.com.shell-extension.zip . && mv time_tracker_jsnjack@gmail.com.shell-extension.zip ../
	rm -rf build

build: update_po time_tracker_jsnjack@gmail.com/schemas/gschemas.compiled

all: build time_tracker_jsnjack@gmail.com.shell-extension.zip

install: time_tracker_jsnjack@gmail.com.shell-extension.zip
	gnome-extensions install ./time_tracker_jsnjack@gmail.com.shell-extension.zip --force

launch:
	dbus-run-session -- gnome-shell --nested --wayland
