
all: final.html

final.html: final.md
	pandoc --toc -o final.html --template toc-sidebar.html --mathjax --css=css/cg_report.css -s final.md 
