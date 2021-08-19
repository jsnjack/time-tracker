TT_PO = `find ./time_tracker_jsnjack@gmail.com/locale -name *.po`
DOMAIN = time-tracker

update_po:
	for item in $(TT_PO); do \
		echo "Processing" $$item; \
		xgettext --from-code=UTF-8 --output=$$item.tmp ./time_tracker_jsnjack@gmail.com/*.js; \
		msgmerge -U $$item $$item.tmp; \
		rm -f $$item.tmp; \
		msgfmt -c $$item -o `dirname $$item`/${DOMAIN}.mo; \
	done;
